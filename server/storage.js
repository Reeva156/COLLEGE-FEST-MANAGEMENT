const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, 'data', 'db.json');

async function getSeedData() {
  const salt = await bcrypt.genSalt(10);
  const studentPassword = await bcrypt.hash('student123', salt);
  const organizerPassword = await bcrypt.hash('organizer123', salt);
  const users = [
    {
      id: 'usr_org_1',
      name: 'Aryan Verma',
      email: 'organizer@fest.edu',
      passwordHash: organizerPassword,
      role: 'organizer',
      department: 'BCA 3rd Year - Tech Lead',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_student_1',
      name: 'Reeva Solani',
      email: 'reeva@fest.edu',
      passwordHash: studentPassword,
      role: 'participant',
      department: 'BCA 2nd Year',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_student_2',
      name: 'Devansh Dave',
      email: 'devansh@fest.edu',
      passwordHash: studentPassword,
      role: 'participant',
      department: 'BCA 2nd Year',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    }
  ];

  const events = [
    {
      id: 'ev_hack_01',
      title: 'CodeBlitz 2026: 24h Hackathon',
      subtitle: 'Build future web & AI innovations before sunrise',
      description: 'Join the premier 24-hour hackathon of PULSE Fest. Brainstorm, design, and code disruptive solutions in Web3, AI, Climate Tech, and EdTech. Top mentors, midnight pizza, and industry jury.',
      category: 'Technical',
      tag: '🔥 Featured',
      date: '2026-10-24',
      time: '10:00 AM - 10:00 AM (Next Day)',
      venue: 'Turing Advanced Tech Labs, Block C',
      capacity: 80,
      registeredCount: 42,
      isTeamEvent: true,
      teamSize: { min: 2, max: 4 },
      deadline: '2026-10-22T23:59:00',
      registrationStatus: 'Open',
      coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      aspectRatio: 'tall',
      rules: [
        'Teams must consist of 2 to 4 registered college students.',
        'All code must be written during the 24-hour hackathon period.',
        'Use of open source libraries and APIs is allowed and encouraged.',
        'Final pitch is 3 minutes demo followed by 2 minutes Q&A.'
      ],
      coordinator: { name: 'Aryan Verma', contact: '+91 98765 43210', email: 'techfest@college.edu' },
      prize: '₹45,000 Cash Pool + Cloud Credits'
    },
    {
      id: 'ev_dance_02',
      title: 'Step Up: Western & Hip-Hop Crew Dance',
      subtitle: 'Feel the rhythm, ignite the stage',
      description: 'The flagship street and western dance showdown! Bring high octane synchronization, fierce choreography, and electrifying beats to win the championship trophy.',
      category: 'Cultural',
      tag: '⚡ Popular',
      date: '2026-10-25',
      time: '04:00 PM - 07:30 PM',
      venue: 'Main Open Air Amphitheatre',
      capacity: 25,
      registeredCount: 18,
      isTeamEvent: true,
      teamSize: { min: 4, max: 12 },
      deadline: '2026-10-23T18:00:00',
      registrationStatus: 'Open',
      coverImage: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&auto=format&fit=crop&q=80',
      aspectRatio: 'square',
      rules: [
        'Performance duration: 6 to 10 minutes including setup.',
        'Props allowed with prior approval.',
        'Tracks must be submitted 24 hours prior to the event.'
      ],
      coordinator: { name: 'Sneha Patel', contact: '+91 98220 11223', email: 'cultural@college.edu' },
      prize: '₹30,000 + Championship Trophy'
    },
    {
      id: 'ev_gaming_03',
      title: 'Valorant Showdown: Campus Arena',
      subtitle: 'Clutch or kick in 5v5 tactical warfare',
      description: 'High-octane esports tournament with custom lobby shoutcasting on projector screens. Single elimination bracket leading to intense best-of-3 Grand Finals.',
      category: 'Gaming',
      tag: '🎮 Gaming',
      date: '2026-10-24',
      time: '01:00 PM - 06:00 PM',
      venue: 'E-Sports Arena & Gaming Lounge, 2nd Floor',
      capacity: 32,
      registeredCount: 28,
      isTeamEvent: true,
      teamSize: { min: 5, max: 5 },
      deadline: '2026-10-23T12:00:00',
      registrationStatus: 'Open',
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      aspectRatio: 'tall',
      rules: [
        '5 players per squad. Standard competitive tournament rules.',
        'Map bans conducted before each match on site.',
        'Tournament grade peripherals provided or BYO allowed.'
      ],
      coordinator: { name: 'Kabir Khan', contact: '+91 91122 33445', email: 'gaming@college.edu' },
      prize: '₹25,000 + Pro Gaming Gear'
    },
    {
      id: 'ev_photo_04',
      title: 'Aperture: Street & Campus Photography',
      subtitle: 'Capture the soul of festivity through your lens',
      description: 'Solo photography marathon. Capture the unseen moments, candid expressions, dynamic lights, and architectural shadows across the 3-day fest campus.',
      category: 'Arts',
      tag: '📸 Creative',
      date: '2026-10-25',
      time: '09:00 AM - 03:00 PM',
      venue: 'Media Studio & Campus Grounds',
      capacity: 50,
      registeredCount: 22,
      isTeamEvent: false,
      teamSize: { min: 1, max: 1 },
      deadline: '2026-10-24T18:00:00',
      registrationStatus: 'Open',
      coverImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
      aspectRatio: 'tall',
      rules: [
        'Solo participation only.',
        'Theme will be revealed at 09:00 AM on the day of event.',
        'Submissions must retain original EXIF metadata. Minimal editing.'
      ],
      coordinator: { name: 'Riya Sen', contact: '+91 97654 32190', email: 'photo@college.edu' },
      prize: '₹15,000 + Lens Kit'
    },
    {
      id: 'ev_band_05',
      title: 'Battle of the Bands: Rock & Fusion Night',
      subtitle: 'Turn up the amplifiers and roar',
      description: 'Live musical duel between the finest college bands. From rock anthems to soulful fusion, let your riffs and drumbeats captivate thousands of roaring fans.',
      category: 'Cultural',
      tag: '🎸 Live',
      date: '2026-10-26',
      time: '06:00 PM - 10:00 PM',
      venue: 'Grand Central Stage',
      capacity: 15,
      registeredCount: 12,
      isTeamEvent: true,
      teamSize: { min: 3, max: 8 },
      deadline: '2026-10-23T20:00:00',
      registrationStatus: 'Open',
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      aspectRatio: 'square',
      rules: [
        'Time slot: 15 minutes performance + 5 minutes soundcheck.',
        'At least one original composition or creative fusion required.',
        'Drum kit and sound engineer provided; bring own instruments.'
      ],
      coordinator: { name: 'Aditya Roy', contact: '+91 98334 55667', email: 'music@college.edu' },
      prize: '₹50,000 + Studio Recording Session'
    },
    {
      id: 'ev_quiz_06',
      title: 'Brainiac: National General & Pop Quiz',
      subtitle: 'Trivia, intellect, and razor-sharp deduction',
      description: 'A mind-bending quiz featuring rounds on tech history, cinema, world events, meme lore, and scientific wonders. Hosted by renowned quizmasters.',
      category: 'Literary',
      tag: '🧠 Intellect',
      date: '2026-10-24',
      time: '11:00 AM - 02:00 PM',
      venue: 'Auditorium Hall 2',
      capacity: 60,
      registeredCount: 35,
      isTeamEvent: true,
      teamSize: { min: 2, max: 2 },
      deadline: '2026-10-23T23:59:00',
      registrationStatus: 'Open',
      coverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
      aspectRatio: 'tall',
      rules: [
        'Teams of 2. Written preliminary round followed by top 6 stage finals.',
        'No smart devices allowed during rounds.',
        'Quizmaster decision is final.'
      ],
      coordinator: { name: 'Kavita Nair', contact: '+91 99887 76655', email: 'quiz@college.edu' },
      prize: '₹20,000 + Hardcover Collector Books'
    },
    {
      id: 'ev_robo_07',
      title: 'RoboWars: Steel & Sparks Combat',
      subtitle: 'May the best heavyweight bot survive',
      description: 'Clash of custom wireless combat robots inside an enclosed safety bulletproof arena. Pushing power, flippers, spinning blades, and raw torque.',
      category: 'Technical',
      tag: '🤖 Combat',
      date: '2026-10-25',
      time: '01:00 PM - 05:00 PM',
      venue: 'Engineering Arena, Quadrangle',
      capacity: 20,
      registeredCount: 16,
      isTeamEvent: true,
      teamSize: { min: 2, max: 4 },
      deadline: '2026-10-22T18:00:00',
      registrationStatus: 'Open',
      coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
      aspectRatio: 'square',
      rules: [
        'Weight limit: 15kg and 30kg class.',
        'Failsafe pneumatic and radio cutoff mandatory.',
        'Match duration: 3 minutes per round.'
      ],
      coordinator: { name: 'Harsh Joshi', contact: '+91 98450 12345', email: 'robotics@college.edu' },
      prize: '₹40,000 + Maker Hardware Kits'
    },
    {
      id: 'ev_fashion_08',
      title: 'Vogue Runway: Sustainable Haute Couture',
      subtitle: 'Where style meets eco-conscious storytelling',
      description: 'Step into glamour with a purpose. Colleges showcase dramatic styling, upcycled couture, and theatrical ramp walks celebrating sustainable aesthetics.',
      category: 'Cultural',
      tag: '✨ Glamour',
      date: '2026-10-26',
      time: '07:30 PM - 10:30 PM',
      venue: 'Main Open Air Amphitheatre',
      capacity: 12,
      registeredCount: 10,
      isTeamEvent: true,
      teamSize: { min: 8, max: 16 },
      deadline: '2026-10-22T23:59:00',
      registrationStatus: 'Open',
      coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
      aspectRatio: 'tall',
      rules: [
        'Team slot: 12 minutes max on ramp.',
        'Theme: Neo-Earth & Circular Fashion.',
        'Originality and garment composition will be judged.'
      ],
      coordinator: { name: 'Meera Rajput', contact: '+91 99112 23344', email: 'vogue@college.edu' },
      prize: '₹50,000 + Fashion House Internship'
    }
  ];

  const teams = [
    {
      id: 'team_alpha_01',
      teamName: 'CyberKnights',
      eventId: 'ev_hack_01',
      leaderId: 'usr_student_1',
      memberIds: ['usr_student_1', 'usr_student_2'],
      teamCode: 'CYBER-749',
      createdAt: new Date().toISOString()
    }
  ];

  const registrations = [
    {
      id: 'reg_demo_01',
      eventId: 'ev_hack_01',
      participantId: 'usr_student_1',
      participantName: 'Reeva Solani',
      participantEmail: 'reeva@fest.edu',
      isTeam: true,
      teamId: 'team_alpha_01',
      teamName: 'CyberKnights',
      qrToken: 'FEST-HACK-CK99-REEVA',
      status: 'Registered',
      registeredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      checkedInAt: null,
      checkedInBy: null
    },
    {
      id: 'reg_demo_02',
      eventId: 'ev_photo_04',
      participantId: 'usr_student_1',
      participantName: 'Reeva Solani',
      participantEmail: 'reeva@fest.edu',
      isTeam: false,
      teamId: null,
      teamName: null,
      qrToken: 'FEST-PHOTO-REEVA-4482',
      status: 'Attended',
      registeredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      checkedInAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      checkedInBy: 'usr_org_1'
    }
  ];

  const results = [
    {
      id: 'res_photo_01',
      eventId: 'ev_photo_04',
      eventTitle: 'Aperture: Street & Campus Photography',
      status: 'Published',
      publishedAt: new Date(Date.now() - 43200000).toISOString(),
      publishedBy: 'Prof. Ramesh Sharma',
      winners: [
        {
          position: '1st Place',
          recipientName: 'Reeva Solani',
          participantId: 'usr_student_1',
          college: 'School of Computer Applications',
          prize: '₹15,000 + Gold Medal',
          certificateIssued: true
        },
        {
          position: '2nd Place',
          recipientName: 'Kunal Deshmukh',
          participantId: 'usr_external_9',
          college: 'National Institute of Design',
          prize: '₹10,000 + Silver Medal',
          certificateIssued: true
        },
        {
          position: '3rd Place',
          recipientName: 'Ananya Roy',
          participantId: 'usr_external_10',
          college: 'Delhi Arts College',
          prize: '₹5,000 + Bronze Medal',
          certificateIssued: true
        }
      ]
    }
  ];

  const certificates = [
    {
      id: 'cert_reeva_01',
      registrationId: 'reg_demo_02',
      participantId: 'usr_student_1',
      participantName: 'Reeva Solani',
      eventId: 'ev_photo_04',
      eventTitle: 'Aperture: Street & Campus Photography',
      category: 'Arts & Media',
      position: '1st Place Winner (Gold)',
      issueDate: 'October 25, 2026',
      verificationCode: 'PULSE-2026-ART-00194',
      signatureAuthority: 'Prof. Ramesh Sharma (Convener)'
    }
  ];

  const contacts = [
    {
      id: 'cnt_01',
      name: 'Rohan Mehra',
      email: 'rohan.m@gmail.com',
      subject: 'Inquiry regarding outside college team participation',
      message: 'Hello, can non-host college students participate in the CodeBlitz Hackathon as mixed teams?',
      status: 'Resolved',
      createdAt: new Date().toISOString()
    }
  ];

  return { users, events, teams, registrations, results, certificates, contacts };
}

const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class Storage {
  constructor() {
    this.init();
  }

  async init() {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = await getSeedData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      console.log('Database initialized and seeded with rich fest data.');
    }
  }

  read() {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        return { users: [], events: [], teams: [], registrations: [], results: [], certificates: [], contacts: [] };
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading database file:', e);
      return { users: [], events: [], teams: [], registrations: [], results: [], certificates: [], contacts: [] };
    }
  }

  write(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  getCollection(name) {
    const data = this.read();
    return data[name] || [];
  }

  saveCollection(name, items) {
    const data = this.read();
    data[name] = items;
    this.write(data);
  }
}

const db = new Storage();
module.exports = db;
