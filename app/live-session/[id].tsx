import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, Pressable, StyleSheet, Dimensions, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeIn, FadeInDown, FadeInUp, ZoomIn,
    useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import api from '../../lib/api';
import TouchableScale from '../../components/ui/TouchableScale';
import { COLORS, SHADOWS } from '../../design-system/theme';

// ── Graceful LiveKit import (fails in Expo Go) ──
let AudioSession: any = { startAudioSession: async () => { }, stopAudioSession: async () => { } };
let VideoView: any = View;
let useLocalParticipant: any = () => ({});
let useTracks: any = () => [];
let useRoomContext: any = () => null;
let LiveKitRoom: any = null;
let Track: any = { Source: { Camera: 'camera', Microphone: 'microphone' } };
let liveKitAvailable = false;

try {
    const lk = require('@livekit/react-native');
    AudioSession = lk.AudioSession;
    VideoView = lk.VideoView;
    useLocalParticipant = lk.useLocalParticipant;
    useTracks = lk.useTracks;
    useRoomContext = lk.useRoomContext;
    LiveKitRoom = lk.LiveKitRoom;
    Track = require('livekit-client').Track;
    liveKitAvailable = true;
} catch {
    console.warn('LiveKit native module not available — video calls disabled');
}

// ── Clerk import (also optional in Expo Go without valid key) ──
let useUser: any = () => ({ user: null });
try {
    useUser = require('@clerk/clerk-expo').useUser;
} catch { }

const { width: SW, height: SH } = Dimensions.get('window');

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// ═══════════════════════════════════════════════════════
// MAIN SCREEN (token fetch + LiveKitRoom wrapper)
// ═══════════════════════════════════════════════════════
export default function LiveSessionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useUser();

    // ── LiveKit unavailable (Expo Go) ──
    if (!liveKitAvailable) {
        return (
            <View style={st.darkCenter}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="light-content" />
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📡</Text>
                <Text style={st.errorTitle}>Видео дуудлага боломжгүй</Text>
                <Text style={st.errorSub}>
                    LiveKit модуль суулгаагүй байна. Development build үүсгэнэ үү.
                </Text>
                <TouchableScale onPress={() => router.back()} style={{ marginTop: 24 }}>
                    <LinearGradient colors={[COLORS.gold, COLORS.deepGold]} style={st.retryBtn}>
                        <Text style={st.retryBtnText}>← БУЦАХ</Text>
                    </LinearGradient>
                </TouchableScale>
            </View>
        );
    }

    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const wsUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';
    const roomName = id as string;

    const fetchToken = useCallback(async () => {
        if (!user || !id) return;
        if (!wsUrl) {
            setError('LiveKit серверийн URL тохируулаагүй байна.');
            return;
        }

        setError(null);
        setToken(null);

        try {
            const username = user.firstName || user.fullName || 'Хэрэглэгч';
            const { data } = await api.get(
                `/livekit?room=${roomName}&username=${encodeURIComponent(username)}`
            );

            if (data.token) {
                // Start audio session for iOS
                await AudioSession.startAudioSession();
                setToken(data.token);

                // Mark call as active
                api.patch(`/bookings/${id}`, { callStatus: 'active' }).catch(() => { });
            } else {
                throw new Error('Token авч чадсангүй');
            }
        } catch (err: any) {
            console.error('Token авахад алдаа:', err);
            setError('Холболт тасарлаа. Интернэт холболтоо шалгана уу.');
        }
    }, [id, user, wsUrl, roomName]);

    useEffect(() => {
        fetchToken();
        return () => {
            AudioSession.stopAudioSession();
        };
    }, [fetchToken, retryCount]);

    const handleRetry = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRetryCount((c) => c + 1);
    };

    const handleDisconnect = useCallback(() => {
        api.patch(`/bookings/${id}`, { callStatus: 'ended' }).catch(() => { });
        AudioSession.stopAudioSession();
        router.back();
    }, [id, router]);

    // ── ERROR STATE ──
    if (error) {
        return (
            <View style={st.darkCenter}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="light-content" />
                <Animated.View entering={ZoomIn.duration(400)} style={st.errorCircle}>
                    <Text style={{ fontSize: 36 }}>📡</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ alignItems: 'center' }}>
                    <Text style={st.errorTitle}>Холболт тасарлаа</Text>
                    <Text style={st.errorSub}>{error}</Text>
                    <TouchableScale onPress={handleRetry}>
                        <LinearGradient colors={[COLORS.gold, COLORS.deepGold]} style={[st.retryBtn, SHADOWS.gold]}>
                            <Text style={st.retryBtnText}>ДАХИН ОРОЛДОХ</Text>
                        </LinearGradient>
                    </TouchableScale>
                    <TouchableScale onPress={() => router.back()} style={{ marginTop: 16 }}>
                        <Text style={st.backText}>← Буцах</Text>
                    </TouchableScale>
                </Animated.View>
            </View>
        );
    }

    // ── CONNECTING STATE ──
    if (!token || !wsUrl) {
        return (
            <View style={st.darkCenter}>
                <Stack.Screen options={{ headerShown: false }} />
                <StatusBar barStyle="light-content" />
                <BreathingOrb />
                <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                    <Text style={st.connectingText}>Холбогдож байна...</Text>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(500).duration(500)}>
                    <TouchableScale
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        style={st.cancelBtn}
                    >
                        <Text style={st.cancelBtnText}>Болих</Text>
                    </TouchableScale>
                </Animated.View>
            </View>
        );
    }

    // ── CONNECTED — LiveKitRoom wrapper ──
    return (
        <View style={{ flex: 1, backgroundColor: '#0A0600' }}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <LiveKitRoom
                serverUrl={wsUrl}
                token={token}
                connect={true}
                options={{
                    adaptiveStream: { pixelDensity: 'screen' },
                }}
                onDisconnected={handleDisconnect}
                onError={(err: any) => {
                    console.error('LiveKit error:', err);
                    setError('Холболт тасарлаа');
                }}
            >
                <RoomContent onEnd={handleDisconnect} />
            </LiveKitRoom>
        </View>
    );
}

// ═══════════════════════════════════════════════════════
// BREATHING ORB (connecting state animation)
// ═══════════════════════════════════════════════════════
function BreathingOrb() {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.4);

    useEffect(() => {
        scale.value = withRepeat(
            withTiming(1.3, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
            -1, true
        );
        opacity.value = withRepeat(
            withTiming(0.8, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
            -1, true
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[st.orbContainer, animStyle]}>
            <LinearGradient
                colors={[COLORS.gold, COLORS.deepGold, 'rgba(184,130,10,0.2)']}
                style={st.orb}
            />
        </Animated.View>
    );
}

// ═══════════════════════════════════════════════════════
// ROOM CONTENT (video views + controls)
// ═══════════════════════════════════════════════════════
function RoomContent({ onEnd }: { onEnd: () => void }) {
    const room = useRoomContext();
    const { isCameraEnabled, isMicrophoneEnabled, localParticipant } = useLocalParticipant();
    const tracks = useTracks([
        { source: Track.Source.Camera, withPlaceholder: true },
        { source: Track.Source.Microphone, withPlaceholder: false },
    ]);

    // Timer
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Separate local vs remote tracks
    const remoteTracks = tracks.filter(
        (t: any) => t.participant.sid !== localParticipant?.sid && t.publication?.track
    );
    const localTrack = tracks.find(
        (t: any) => t.participant.sid === localParticipant?.sid &&
            t.source === Track.Source.Camera &&
            t.publication?.track
    );

    const toggleCamera = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        localParticipant?.setCameraEnabled(!isCameraEnabled);
    }, [localParticipant, isCameraEnabled]);

    const toggleMic = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled);
    }, [localParticipant, isMicrophoneEnabled]);

    const handleEnd = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        room?.disconnect();
        onEnd();
    }, [room, onEnd]);

    // Remote participant name
    const remoteParticipant: any[] = Array.from(room?.remoteParticipants?.values?.() || []);
    const remoteName = remoteParticipant[0]?.name || remoteParticipant[0]?.identity || '';

    return (
        <View style={{ flex: 1 }}>
            {/* ── REMOTE VIDEO (fullscreen) ── */}
            {remoteTracks.length > 0 && remoteTracks[0].publication?.track ? (
                <VideoView
                    style={st.remoteVideo}
                    videoTrack={remoteTracks[0].publication.track as any}
                    objectFit="cover"
                />
            ) : (
                <View style={[st.remoteVideo, st.remotePlaceholder]}>
                    <Text style={{ fontSize: 48, marginBottom: 12 }}>🔮</Text>
                    <Text style={st.waitingText}>Хүлээж байна...</Text>
                </View>
            )}

            {/* ── LOCAL VIDEO (pip) ── */}
            {localTrack?.publication?.track && (
                <Animated.View entering={FadeIn.delay(500).duration(400)} style={st.localPip}>
                    <VideoView
                        style={st.localVideo}
                        videoTrack={localTrack.publication.track as any}
                        objectFit="cover"
                        mirror={true}
                    />
                </Animated.View>
            )}

            {/* ── TOP OVERLAY ── */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={st.topOverlay}>
                <View style={st.connectedBadge}>
                    <View style={st.liveIndicator} />
                    <Text style={st.connectedText}>Холбоотой</Text>
                </View>
                <View style={st.timerBadge}>
                    <Text style={st.timerText}>{formatTime(elapsed)}</Text>
                </View>
            </Animated.View>

            {/* ── PARTICIPANT NAME ── */}
            {remoteName ? (
                <Animated.View entering={FadeIn.delay(600).duration(400)} style={st.nameBadge}>
                    <Text style={st.nameText}>{remoteName}</Text>
                </Animated.View>
            ) : null}

            {/* ── CONTROLS BAR ── */}
            <Animated.View entering={FadeInUp.delay(400).duration(500)} style={st.controlsBar}>
                {/* Mic */}
                <TouchableScale onPress={toggleMic} style={[st.controlBtn, !isMicrophoneEnabled && st.controlBtnMuted]}>
                    <Text style={{ fontSize: 22 }}>{isMicrophoneEnabled ? '🎤' : '🔇'}</Text>
                </TouchableScale>

                {/* End Call */}
                <TouchableScale onPress={handleEnd}>
                    <LinearGradient
                        colors={['#C00000', '#FF3333']}
                        style={[st.endCallBtn, {
                            shadowColor: '#FF3333',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5,
                            shadowRadius: 12,
                            elevation: 8,
                        }]}
                    >
                        <Text style={{ fontSize: 24 }}>📞</Text>
                    </LinearGradient>
                </TouchableScale>

                {/* Camera */}
                <TouchableScale onPress={toggleCamera} style={[st.controlBtn, !isCameraEnabled && st.controlBtnMuted]}>
                    <Text style={{ fontSize: 22 }}>{isCameraEnabled ? '📷' : '🚫'}</Text>
                </TouchableScale>
            </Animated.View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════
const st = StyleSheet.create({
    darkCenter: {
        flex: 1, backgroundColor: '#0A0600',
        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
    },

    /* Connecting Orb */
    orbContainer: { marginBottom: 40 },
    orb: {
        width: 100, height: 100, borderRadius: 50,
    },

    connectingText: {
        fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 18,
        color: COLORS.gold, letterSpacing: 1, textAlign: 'center',
    },
    cancelBtn: {
        marginTop: 32, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(212,160,32,0.4)',
        paddingVertical: 14, paddingHorizontal: 40,
    },
    cancelBtnText: { color: COLORS.gold, fontWeight: '600', fontSize: 14, letterSpacing: 1 },

    /* Error */
    errorCircle: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: 'rgba(212,160,32,0.1)', borderWidth: 1.5, borderColor: 'rgba(212,160,32,0.3)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    errorTitle: {
        fontFamily: 'Georgia', fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8,
    },
    errorSub: {
        fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center',
        lineHeight: 22, marginBottom: 28, maxWidth: 260,
    },
    retryBtn: { borderRadius: 18, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center' },
    retryBtnText: { color: '#1A0800', fontWeight: '800', fontSize: 14, letterSpacing: 1.5 },
    backText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' },

    /* Remote video */
    remoteVideo: {
        position: 'absolute', top: 0, left: 0, width: SW, height: SH,
    },
    remotePlaceholder: {
        backgroundColor: '#0A0600', alignItems: 'center', justifyContent: 'center',
    },
    waitingText: {
        fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 16,
        color: 'rgba(255,255,255,0.4)', letterSpacing: 1,
    },

    /* Local PIP */
    localPip: {
        position: 'absolute', bottom: 130, left: 16,
        width: 80, height: 100, borderRadius: 14,
        borderWidth: 2, borderColor: COLORS.gold,
        overflow: 'hidden',
        ...SHADOWS.gold,
    },
    localVideo: { width: '100%', height: '100%' },

    /* Top overlay */
    topOverlay: {
        position: 'absolute', top: 60, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20,
    },
    connectedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(10,6,0,0.65)', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 8,
    },
    liveIndicator: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A',
    },
    connectedText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    timerBadge: {
        backgroundColor: 'rgba(10,6,0,0.65)', borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 8,
    },
    timerText: {
        color: COLORS.gold, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'],
    },

    /* Name badge */
    nameBadge: {
        position: 'absolute', top: 110, left: 20,
        backgroundColor: 'rgba(10,6,0,0.65)', borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    nameText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    /* Controls */
    controlsBar: {
        position: 'absolute', bottom: 40, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 28,
        backgroundColor: 'rgba(10,6,0,0.75)', marginHorizontal: 40,
        borderRadius: 32, paddingVertical: 16, paddingHorizontal: 24,
    },
    controlBtn: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: 'rgba(212,160,32,0.25)', borderWidth: 1, borderColor: 'rgba(212,160,32,0.35)',
        alignItems: 'center', justifyContent: 'center',
    },
    controlBtnMuted: {
        backgroundColor: 'rgba(200,146,10,0.15)', borderColor: 'rgba(200,146,10,0.2)',
    },
    endCallBtn: {
        width: 54, height: 54, borderRadius: 27,
        alignItems: 'center', justifyContent: 'center',
    },
});
