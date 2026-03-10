
import * as React from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Mic, MicOff, Video, VideoOff } from 'lucide-react-native';

// LiveKit requires native module linking — not available in Expo Go.
// We lazy-import to prevent a hard crash when running in managed workflow.
let LiveKitRoom: any = null;
let useTracks: any = null;
let VideoTrack: any = null;
let TrackType: any = null;
let LIVEKIT_AVAILABLE = false;

try {
    const lk = require('@livekit/react-native');
    LiveKitRoom = lk.LiveKitRoom;
    useTracks = lk.useTracks;
    VideoTrack = lk.VideoTrack;
    const lkClient = require('livekit-client');
    TrackType = lkClient.Track;
    LIVEKIT_AVAILABLE = true;
} catch (e) {
    console.warn('LiveKit native module not available. Video calls are disabled in Expo Go.');
}

export default function LiveSession({ token, serverUrl, roomName, onDisconnect }: { token: string, serverUrl: string, roomName: string, onDisconnect: () => void }) {
    const [micEnabled, setMicEnabled] = React.useState(true);
    const [camEnabled, setCamEnabled] = React.useState(true);

    if (!LIVEKIT_AVAILABLE) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF6E3', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#44403C', marginBottom: 8, textAlign: 'center' }}>
                    Video Calls Unavailable
                </Text>
                <Text style={{ fontSize: 14, color: '#78716C', textAlign: 'center', marginBottom: 24 }}>
                    LiveKit native module is not linked. Please use a development build instead of Expo Go to enable video calls.
                </Text>
                <TouchableOpacity onPress={onDisconnect} style={{ backgroundColor: '#D97706', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#800000' }}>
            <LiveKitRoom
                token={token}
                serverUrl={serverUrl}
                connect={true}
                video={camEnabled}
                audio={micEnabled}
                onDisconnected={onDisconnect}
                options={{ adaptiveStream: true }}
            >
                <VideoConference
                    onToggleMic={() => setMicEnabled(!micEnabled)}
                    onToggleCam={() => setCamEnabled(!camEnabled)}
                    micEnabled={micEnabled}
                    camEnabled={camEnabled}
                    onDisconnect={onDisconnect}
                />
            </LiveKitRoom>
        </View>
    );
}

function VideoConference({ onToggleMic, onToggleCam, micEnabled, camEnabled, onDisconnect }: any) {
    const tracks = useTracks([
        TrackType.Source.Camera,
        TrackType.Source.ScreenShare,
    ]);

    const renderTrack = (track: any) => {
        if (!track.publication) return null;
        return (
            <View style={styles.participantView} key={track.participant.identity}>
                <VideoTrack
                    trackRef={track as any}
                    style={styles.videoTrack}
                    zOrder={1}
                />
                <View style={styles.participantLabel}>
                    <Text style={styles.participantName}>{track.participant.identity}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.videoGrid}>
                {tracks.map((track: any) => renderTrack(track))}
                {tracks.length === 0 && (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-white">Waiting for others to join...</Text>
                    </View>
                )}
            </View>

            <View style={styles.controls}>
                <TouchableOpacity onPress={onToggleMic} style={[styles.controlBtn, !micEnabled && styles.disabledBtn]}>
                    {micEnabled ? <Mic size={28} color="#800000" /> : <MicOff size={28} color="#800000" />}
                </TouchableOpacity>

                <TouchableOpacity onPress={onDisconnect} style={[styles.controlBtn, { backgroundColor: '#FFD700', width: 70, height: 70, borderRadius: 35 }]}>
                    <X size={36} color="#800000" />
                </TouchableOpacity>

                <TouchableOpacity onPress={onToggleCam} style={[styles.controlBtn, !camEnabled && styles.disabledBtn]}>
                    {camEnabled ? <Video size={28} color="#800000" /> : <VideoOff size={28} color="#800000" />}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    videoGrid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    participantView: {
        flex: 1,
        minWidth: '50%',
        minHeight: '50%',
        margin: 2,
        backgroundColor: '#292524',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    videoTrack: {
        flex: 1,
    },
    participantLabel: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
        borderRadius: 4,
    },
    participantName: {
        color: 'white',
        fontSize: 12,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        gap: 30,
    },
    controlBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFD700', // Gold
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    disabledBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        opacity: 0.5,
    }
});
