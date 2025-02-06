// Utility function to calculate the user's level based on total games played.
// The progression is defined as:
// Level 1: starting level (0 games);
// Level 2: 10 games total;
// Level 3: additional 15 games (25 total);
// Level 4: additional 20 games (45 total);
// etc...
function calculateLevel(gamesPlayed) {
    let level = 1;
    let gamesRequired = 10;       // Games required for level 2
    let totalRequired = 10;       // Total games needed for the next level

    while (gamesPlayed >= totalRequired) {
        level++;
        gamesRequired += 5;       // Increase games required by 5 for each level up
        totalRequired += gamesRequired;
    }

    return level;
}

export default calculateLevel; 