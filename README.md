# Metashot Stats Backend

This is the backend service for the Metashot Stats application. It provides APIs to fetch and analyze daily user metrics and game-specific statistics from a MongoDB database.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
  - [Response Format](#response-format)
  - [Daily Report Endpoints](#daily-report-endpoints)
  - [Game Stats Endpoints](#game-stats-endpoints)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Connection URI

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/unni2313/metashot_stats.git
    cd metashot_stats
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
```

## Running the Server

To start the server:

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Documentation

### Response Format

All API responses follow a standard JSON structure:

```json
{
  "status": "success",
  "message": "Descriptive message",
  "data": {
    // Response data
  }
}
```

### Daily Report Endpoints

Base URL: `/daily`

These endpoints provide general user engagement and system usage metrics.

**Common Request Body:**
```json
{
  "date": "YYYY-MM-DD"
}
```

| Endpoint | Method | Description | Request Body | Response Data Example |
| :--- | :--- | :--- | :--- | :--- |
| `/dailyInstalls` | POST | Get number of new installs for a specific date. | `{ "date": "..." }` | `{ "no_installs": 120 }` |
| `/activeUsers` | POST | Get unique active users for a specific date. | `{ "date": "..." }` | `{ "NO_Active_Users": 450 }` |
| `/monthlyActiveUsers` | POST | Get monthly active users ending on a specific date. | `{ "date": "..." }` | `{ "NO_Active_Users": 1200 }` |
| `/dailyProgress` | POST | Compare daily active users vs monthly active users. | `{ "date": "..." }` | `{ "dailyActiveUsers": 450, "monthlyActiveUsers": 1200, "progressPercentage": "37.50%" }` |
| `/totalMatches` | POST | Get total matches played on a specific date. | `{ "date": "..." }` | `{ "No_of_Matches": 800 }` |
| `/playerAvgDaily` | POST | Get average matches per daily active user. | `{ "date": "..." }` | `{ "averageMatchesPerUser": 1.78 }` |
| `/dailyReport` | POST | Consolidated report of all above metrics. | `{ "date": "..." }` | `{ "dailyNewInstalls": 120, "dailyActiveUsers": 450, "monthlyActiveUsers": 1200, ... }` |

### Game Stats Endpoints

Base URL: `/stats`

These endpoints provide statistics specific to game modes (e.g., `quickPlay`, `weeklyEvent`).

**Common Request Body:**
```json
{
  "date": "YYYY-MM-DD",
  "gameType": "quickPlay" // or "weeklyEvent"
}
```

| Endpoint | Method | Description | Response Data Example |
| :--- | :--- | :--- | :--- |
| `/totalMatches` | POST | Total matches for the specified game type. | `{ "QuickPlay_Matches": 300 }` |
| `/uniquePlayers` | POST | Unique players for the specified game type. | `{ "QuickPlay_UniquePlayers": 150 }` |
| `/adoptionPercentage` | POST | % of daily active users playing this game type. | `{ "QuickPlay_Users": 150, "Total_DailyActiveUsers": 450, "Adoption_Percentage": "33.33%" }` |
| `/matchPerADU` | POST | Ratio of game matches to total daily active users. | `{ "QuickPlay_Matches": 300, "Total_DailyActiveUsers": 450, "Match_Per_ADU_Ratio": "0.67" }` |
| `/matchPerPlayer` | POST | Ratio of game matches to unique players of that game. | `{ "QuickPlay_Matches": 300, "QuickPlay_UniquePlayers": 150, "Match_Per_Player_Ratio": "2.00" }` |
| `/winRate` | POST | Win rate percentage for the game type. | `{ "QuickPlay_Wins": 150, "QuickPlay_TotalMatches": 300, "QuickPlay_WinRate": "50.00%" }` |

**Note on `gameType`**:
- Supported values: `quickPlay`, `weeklyEvent`.
- The response keys usually adapt to the `gameType` (e.g., `Week_Event_Matches` instead of `QuickPlay_Matches`).
