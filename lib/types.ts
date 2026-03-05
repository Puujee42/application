export interface User {
    _id?: string;
    clerkId: string; // Links to Clerk Auth (or 'custom-db' for direct users)
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    password?: string; // Hashed password for direct DB auth

    // Spiritual Stats
    dateOfBirth?: string; // YYYY-MM-DD
    zodiacYear?: string;
    karma: number;
    meditationDays: number;
    totalMerits: number;
    earnings?: number; // Total earnings for monks
    role: "seeker" | "monk" | "admin";
    monkStatus?: "pending" | "approved" | "rejected"; // Approval status for monks
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Monk {
    _id?: string;
    name: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    };
    title: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    };
    image: string;
    video?: string;
    specialties: string[]; // e.g., ["Astrology", "Meditation"]
    bio: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    };
    isAvailable: boolean;
    quote: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    };
    monkNumber?: number; // Order/Display number

    // New Fields
    phone?: string;
    isSpecial?: boolean; // Admin-controlled special status
    yearsOfExperience: number;
    education: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    };
    philosophy: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    };
    services: {
        id: string;
        name: {
            mn: string;
            en: string;
            ko?: string;
            de?: string;
        };
        price: number; // in local currency
        duration: string; // e.g., "30 min", "1 hour"
        status?: 'pending' | 'active' | 'rejected';
    }[];
    schedule?: {
        day: string;
        start: string;
        end: string;
        active: boolean
    }[];
    blockedSlots?: {
        id: string;
        date: string;
        time: string;
    }[];
}

export interface Booking {
    _id?: string;
    userId: string; // Clerk ID or Custom ID
    monkId: string;
    date: Date | string;
    time?: string; // Add time to interface as it is used
    userPhone?: string;
    userEmail?: string;
    type?: "Astrology" | "Counseling" | "Prayer" | "Ritual"; // Made optional as it might be derived from service
    serviceName?: { mn: string; en: string; ko?: string; de?: string; }; // Add serviceName to interface
    status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected"; // Add rejected
    notes?: string;
    createdAt: Date | string;
}

export interface Comment {
    _id?: string;
    userId?: string; // Optional if guest
    authorName: string;
    authorRole: string;
    avatar: string;
    text: string;
    karma: number; // Likes/Upvotes
    element: "gold" | "saffron" | "ochre" | "light" | "earth" | "wind" | "water" | "fire" | "air" | "dark"; // Visual theme
    createdAt: Date | string;
}

export interface Service {
    _id?: string;
    id: string;
    name: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    };
    price: number
    duration: string; // e.g., "30 min", "1 hour"
    type: "teaching" | "divination"; // Aesthetic theme
    desc: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    }
    subtitle: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    };
    title: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    };
    image?: string;
    quote?: {
        mn: string;
        en: string;
        ko?: string;
        de?: string;
    };
}

export interface Message {
    _id?: string;
    bookingId: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: Date | string;
}
