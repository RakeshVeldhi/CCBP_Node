const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketTeam.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    jerseyNumber: dbObject.jersey_number,
    role: dbObject.role,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      cricket_team`;
  const players = await db.all(getPlayersQuery);
  response.send(
    players.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

app.post("/players/", async (request, response) => {
  const playerDetails = request.body;
  const { playerName, jerseyNumber, playerRole } = playerDetails;

  const addPlayerQuery = `
      INSERT INTO
        cricket_team (player_name, jersey_number, role)
      VALUES
        (
          '${playerName}',
           ${jerseyNumber},
          '${playerRole}'
        );`;

  const dbResponse = await db.run(addPlayerQuery);
  if (dbResponse.changes > 0) {
    response.send("Player Added to Team");
  } else {
    response.status(500).send({ error: "Failed to add player" });
  }
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `
    SELECT
      *
    FROM
      cricket_team 
    where 
      player_id = ${playerId}`;
  const player = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName, jerseyNumber, playerRole } = playerDetails;

  const updatePlayerQuery = `UPDATE cricket_team
    SET 
        player_name = '${playerName}', 
        jersey_number = ${jerseyNumber}, 
        role = '${playerRole}'
    WHERE 
        player_id = ${playerId};
    `;

  const dbResponse = await db.run(updatePlayerQuery);
  if (dbResponse.changes > 0) {
    response.send("Player Details Updated");
  } else {
    response.status(500).send({ error: "Failed to update player details" });
  }
});

app.delete("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const updatePlayerQuery = `
    DELETE from cricket_team
    WHERE player_id = ${playerId};
    `;

  const dbResponse = await db.run(updatePlayerQuery);
  if (dbResponse.changes > 0) {
    response.send("Player Removed");
  } else {
    response.status(500).send({ error: "Failed to remove the player" });
  }
});

module.exports = app;
