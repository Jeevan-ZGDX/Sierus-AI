export const initialHackathons = [
  {
    id: "hack-1",
    title: "Global AI & Autonomous Agents Hackathon 2026",
    description: "Build cutting-edge multi-agent systems, generative AI applications, and autonomous workflows solving real-world enterprise problems.",
    organizer: "DeepTech AI Alliance",
    category: "AI/ML",
    mode: "Online",
    location: "Online (Global)",
    registrationDeadline: "2026-10-25",
    eventStartDate: "2026-11-01",
    eventEndDate: "2026-11-03",
    registrationUrl: "https://example.com/global-ai-hackathon",
    bookmarked: true,
    status: "Registered"
  },
  {
    id: "hack-2",
    title: "NextGen Web3 & Zero-Knowledge Summit",
    description: "Design decentralized dApps, zero-knowledge privacy layers, and cross-chain interoperability protocols.",
    organizer: "Ethereum Developers Guild",
    category: "Blockchain",
    mode: "Hybrid",
    location: "San Francisco, CA & Online",
    registrationDeadline: "2026-10-18",
    eventStartDate: "2026-10-24",
    eventEndDate: "2026-10-26",
    registrationUrl: "https://example.com/web3-zk-summit",
    bookmarked: false,
    status: "Not Registered"
  },
  {
    id: "hack-3",
    title: "Fullstack Cloud & Microservices Sprint",
    description: "Create scalable cloud-native architectures, real-time reactive platforms, and high-performance serverless services.",
    organizer: "CloudNative Collective",
    category: "Web Development",
    mode: "Online",
    location: "Online",
    registrationDeadline: "2026-10-12",
    eventStartDate: "2026-10-15",
    eventEndDate: "2026-10-17",
    registrationUrl: "https://example.com/cloud-microservices-sprint",
    bookmarked: true,
    status: "Participating"
  },
  {
    id: "hack-4",
    title: "Smart Hardware & Edge IoT Innovators",
    description: "Prototype embedded systems, robotics sensors, and smart city automation with edge AI processing.",
    organizer: "RoboTech Institute",
    category: "IoT",
    mode: "Offline",
    location: "Austin, Texas",
    registrationDeadline: "2026-11-05",
    eventStartDate: "2026-11-14",
    eventEndDate: "2026-11-16",
    registrationUrl: "https://example.com/smart-edge-iot",
    bookmarked: false,
    status: "Not Registered"
  },
  {
    id: "hack-5",
    title: "CyberShield CTF & Defense Challenge",
    description: "Test application security boundaries, patch zero-day vulnerabilities, and construct defensive cryptographic primitives.",
    organizer: "InfoSec Alliance",
    category: "Cybersecurity",
    mode: "Online",
    location: "Online",
    registrationDeadline: "2026-09-20",
    eventStartDate: "2026-09-25",
    eventEndDate: "2026-09-27",
    registrationUrl: "https://example.com/cybershield-ctf",
    bookmarked: false,
    status: "Completed"
  },
  {
    id: "hack-6",
    title: "Cross-Platform Mobile App Jam",
    description: "Build intuitive, fluid, and offline-first mobile experiences for iOS and Android using modern frameworks.",
    organizer: "MobileDev United",
    category: "Mobile Development",
    mode: "Hybrid",
    location: "Berlin, Germany & Online",
    registrationDeadline: "2026-11-20",
    eventStartDate: "2026-11-28",
    eventEndDate: "2026-11-30",
    registrationUrl: "https://example.com/mobile-app-jam",
    bookmarked: true,
    status: "Not Registered"
  },
  {
    id: "hack-7",
    title: "Open Innovation & ClimateTech Challenge",
    description: "Collaborate on open-source solutions tackling carbon accounting, renewable energy distribution, and sustainability.",
    organizer: "GreenTech Open Lab",
    category: "Open Innovation",
    mode: "Online",
    location: "Online",
    registrationDeadline: "2026-10-30",
    eventStartDate: "2026-11-08",
    eventEndDate: "2026-11-10",
    registrationUrl: "https://example.com/climatetech-challenge",
    bookmarked: false,
    status: "Not Registered"
  }
];

export const CATEGORIES = [
  "All",
  "AI/ML",
  "Web Development",
  "Mobile Development",
  "Blockchain",
  "Cybersecurity",
  "IoT",
  "Cloud",
  "Open Innovation",
  "Other"
];

export const FORM_CATEGORIES = CATEGORIES.filter(c => c !== "All");

export const MODES = ["All", "Online", "Offline", "Hybrid"];
export const FORM_MODES = ["Online", "Offline", "Hybrid"];

export const STATUSES = ["All", "Not Registered", "Registered", "Participating", "Completed"];
export const FORM_STATUSES = ["Not Registered", "Registered", "Participating", "Completed"];
