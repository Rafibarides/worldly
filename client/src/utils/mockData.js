// Mock data for development and testing

export const mockUsers = [
  {
    id: "u1",
    username: "geowizard",
    email: "geo@example.com",
    createdAt: "2024-01-01T00:00:00Z",
    stats: {
      gamesPlayed: 42,
      gamesWon: 28,
      totalCountriesGuessed: 156,
    },
    badges: ["Africa", "South America", "Oceania", "Asia", "Europe", "North America"],
  },
  {
    id: "u2",
    username: "mapmaster",
    email: "map@example.com",
    createdAt: "2024-01-02T00:00:00Z",
    stats: {
      gamesPlayed: 35,
      gamesWon: 20,
      totalCountriesGuessed: 123,
    },
    badges: ["worldExplorer"],
  },
  {
    id: "u3",
    username: "globetrotter",
    email: "globe@example.com",
    createdAt: "2024-01-03T00:00:00Z",
    stats: {
      gamesPlayed: 28,
      gamesWon: 15,
      totalCountriesGuessed: 98,
    },
    badges: [],
  },
];

export const mockGames = [
  {
    id: "g1",
    status: "ongoing",
    gameType: "multiplayer",
    startTime: "2024-03-15T10:00:00Z",
    endTime: null,
    participants: [
      {
        userId: "u1",
        score: 5,
        countriesGuessed: ["France", "Spain", "Italy", "Germany", "Portugal"],
      },
      {
        userId: "u2",
        score: 3,
        countriesGuessed: ["Belgium", "Netherlands", "Luxembourg"],
      },
    ],
  },
  {
    id: "g2",
    status: "completed",
    gameType: "solo",
    startTime: "2024-03-14T15:00:00Z",
    endTime: "2024-03-14T15:05:00Z",
    participants: [
      {
        userId: "u1",
        score: 10,
        countriesGuessed: ["Japan", "China", "Korea", "Vietnam", "Thailand", 
                          "Indonesia", "Malaysia", "Singapore", "Philippines", "India"],
      },
    ],
  },
];

export const mockChallenges = [
  {
    id: "c1",
    challenger: "u1",
    challenged: "u2",
    status: "pending",
    createdAt: "2024-03-15T09:00:00Z",
  },
  {
    id: "c2",
    challenger: "u2",
    challenged: "u3",
    status: "accepted",
    createdAt: "2024-03-15T08:00:00Z",
    gameId: "g1",
  },
  {
    id: "c3",
    challenger: "u3",
    challenged: "u1",
    status: "missed",
    createdAt: "2024-03-14T10:00:00Z",
  },
];

export const mockFriendships = [
  {
    userId1: "u1",
    userId2: "u2",
    status: "accepted",
  },
  {
    userId1: "u1",
    userId2: "u3",
    status: "pending",
  },
];

export const mockBadges = [
  {
    id: "worldExplorer",
    name: "World Master",
    description: "Guess 100 different countries correctly",
    icon: require('../../assets/images/badges/australia.png'),
    requirement: 100,
  },
  {
    id: "speedDemon",
    name: "Speed Demon",
    description: "Win a game in under 60 seconds",
    icon: require('../../assets/images/badges/australia.png'),
    requirement: 60,
  },
  {
    id: "perfectScore",
    name: "Perfect Score",
    description: "Get all countries correct in a single game",
    icon: "🎯",
    requirement: "allCorrect",
  },
  {
    id: "Africa",
    name: "Africa",
    description: "Complete all countries in Africa",
    icon: require('../../assets/images/badges/africa.png'),
    requirement: "africa",
  },
  {
    id: "South America",
    name: "South America",
    description: "Complete all countries in South America",
    icon: require('../../assets/images/badges/south-america.png'),
    requirement: "southAmerica",
  },
  {
    id: "Oceania",
    name: "Oceania",
    description: "Complete all countries in Oceania",
    icon: require('../../assets/images/badges/australia.png'),
    requirement: "oceania",
  },
  {
    id: "Asia",
    name: "Asia",
    description: "Complete all countries in Asia",
    icon: require('../../assets/images/badges/asia.png'),
    requirement: "asia",
  },
  {
    id: "Europe",
    name: "Europe",
    description: "Complete all countries in Europe",
    icon: require('../../assets/images/badges/europe.png'),
    requirement: "europe",
  },
  {
    id: "North America",
    name: "North America",
    description: "Complete all countries in North America",
    icon: require('../../assets/images/badges/north-america.png'),
    requirement: "northAmerica",
  },
];

export const mockGameLogs = [
  {
    id: "l1",
    userId: "u1",
    gameId: "g1",
    action: "guessed_country",
    details: {
      country: "France",
      correct: true,
      timestamp: "2024-03-15T10:01:00Z",
    },
  },
  {
    id: "l2",
    userId: "u1",
    gameId: "g1",
    action: "earned_badge",
    details: {
      badgeId: "speedDemon",
      timestamp: "2024-03-15T10:02:00Z",
    },
  },
];

// Sample countries for the game
export const mockCountries = [
  {
    name: "France",
    capital: "Paris",
    region: "Europe",
    difficulty: 1,
  },
  {
    name: "Japan",
    capital: "Tokyo",
    region: "Asia",
    difficulty: 1,
  },
  {
    name: "Burkina Faso",
    capital: "Ouagadougou",
    region: "Africa",
    difficulty: 3,
  },
];

// Game settings and constants
export const mockGameSettings = {
  timeLimit: 30, // 5 minutes in seconds
  pointsPerCorrectGuess: 1,
  pointsPerIncorrectGuess: 0,
  minPlayersForMultiplayer: 2,
  maxPlayersForMultiplayer: 4,
  difficultyLevels: {
    easy: { timeLimit: 30, hints: true },
    medium: { timeLimit: 300, hints: true },
    hard: { timeLimit: 180, hints: false },
  },
}; 