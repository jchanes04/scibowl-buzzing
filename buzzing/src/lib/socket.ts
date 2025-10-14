import { browser } from "$app/environment";
import { io, Socket } from "socket.io-client";
import teamsStore, { createTeamStore, type ClientTeamData, type TeamStore } from "./stores/teams";
import playersStore, { createPlayerStore, type PlayerStore } from "./stores/players";
import myMemberStore, { type MyMember } from "./stores/myMember";
import chatMessages from "./stores/chatMessages.svelte";
import gameStore, { type ClientGameData } from "./stores/game";
import { timerStore, gameClockStore } from "./stores/timer";
import moderatorsStore, { createModeratorStore } from "./stores/moderators";
import visualBonus from "./stores/visualBonus.svelte";
import { goto, invalidateAll } from "$app/navigation";
import type { Category, NewQuestionData, ScoreType } from "$lib/classes/Game";
import type { ClientPlayer } from "$lib/classes/client/ClientPlayer";
import type { ClientModerator } from "$lib/classes/client/ClientModerator";
import type { ModeratorData } from "$lib/classes/Moderator";
import type { PlayerData } from "$lib/classes/Player";
import type { TeamData } from "$lib/classes/Team";
import { env } from "$env/dynamic/public";

let teams: Record<string, ClientTeamData & { store: TeamStore }>;
teamsStore.subscribe((value) => (teams = value));

let players: Record<string, ClientPlayer & { store: PlayerStore }>;
playersStore.subscribe((value) => (players = value));

let moderators: Record<string, ClientModerator>;
moderatorsStore.subscribe((value) => (moderators = value));

let game: ClientGameData;
gameStore.subscribe((value) => (game = value));

let myMember: MyMember;
myMemberStore.subscribe((value) => (myMember = value));

let timer: number;
timerStore.subscribe((value) => (timer = value));

const buzzAudio = browser ? new Audio("/buzz.mp3") : null;

let existingSocket: Socket;

export function createSocket(spectator: boolean = false) {
    if (existingSocket) existingSocket.disconnect();

    const socket = io(env.PUBLIC_WS_URL as string, {
        autoConnect: false,
        secure: true,
        withCredentials: true,
        query: {
            spectator
        }
    });
    existingSocket = socket;

    if (browser) {
        socket.connect();
    }

    socket.onAny((event: string, ...args: any[]) => {
        console.log(event, args);
    });

    socket.on("authenticated", ({ name }: { name: string }) => {
        chatMessages.push({
            type: "notification",
            text: name + " has joined the game"
        });
    });

    socket.on("playerJoin", ({ player, team }: { player: PlayerData; team: TeamData }) => {
        const playerTeam = teams[team.id]?.store ?? createTeamStore(team);
        const newPlayer = createPlayerStore(player, playerTeam);
        playerTeam.addPlayer(newPlayer);
        playersStore.addPlayer(newPlayer);

        if (!teams[team.id]) {
            teamsStore.addTeam(playerTeam);
        }

        chatMessages.push({
            type: "notification",
            text: player.name + " has joined the game"
        });
    });

    socket.on("memberRejoin", ({ member, team }: { member: PlayerData | ModeratorData; team: TeamData }) => {
        if (member.type === "moderator") {
            const newModerator = createModeratorStore(member);
            moderatorsStore.addModerator(newModerator);
        } else {
            const playerTeam = teams[team.id]?.store ?? createTeamStore(team);
            const newPlayer = createPlayerStore(member, playerTeam);
            playerTeam.addPlayer(newPlayer);
            playersStore.addPlayer(newPlayer);

            if (!teams[team.id]) {
                teamsStore.addTeam(playerTeam);
            }
        }
        chatMessages.push({
            type: "notification",
            text: member.name + " has rejoined the game"
        });
    });

    socket.on("memberLeave", (id) => {
        const player = players[id];
        const moderator = moderators[id];

        if (moderator) {
            moderatorsStore.removeModerator(id);
            chatMessages.push({
                type: "notification",
                text: moderator.name + " has left the game"
            });
        } else if (player) {
            playersStore.removePlayer(id);
            if (
                teams[player.team.id]?.type !== "default" &&
                Object.values(teams[player.team.id]!.players).length === 1
            ) {
                teamsStore.removeTeam(player.team.id);
            } else {
                player.team.removePlayer(id);
            }
            chatMessages.push({
                type: "notification",
                text: player.name + " has left the game"
            });
        }
    });

    socket.on("promotion", async (memberId: string) => {
        const player = players[memberId];
        const team = player?.team;
        if (team && player) {
            team.removePlayer(player.id);
            playersStore.removePlayer(player.id);
            const newModerator = createModeratorStore({
                id: memberId,
                name: player.name,
                type: "moderator"
            });
            moderatorsStore.addModerator(newModerator);
            chatMessages.push({
                type: "notification",
                text: player.name + " has been promoted to a moderator"
            });

            if (player.id === myMember.id) {
                myMemberStore.setMember({ memberStore: newModerator, moderator: true });
                socket.once("disconnect", async () => {
                    await invalidateAll();
                    socket.connect();
                });
                socket.disconnect();
            }
        }
    });

    socket.on("nameChange", (id: string, name: string) => {
        playersStore.renamePlayer(id, name);
    });

    socket.on("buzz", (id: string) => {
        const player = players[id];
        if (player) {
            gameStore.buzz(player.team.id);
            buzzAudio?.play();
            timerStore.pause();

            chatMessages.push({
                type: "buzz",
                text: player.name + " has buzzed"
            });
        }
    });

    socket.on("buzzAccept", () => {
        chatMessages.push({
            type: "buzz",
            text: "You have buzzed"
        });
    });

    socket.on("buzzFailed", () => {
        if (myMember.team) gameStore.removeTeamBuzz(myMember.team.id);
        chatMessages.push({
            type: "warning",
            text: "You have been outbuzzed"
        });
    });

    socket.on("scoresClear", () => {
        gameStore.scoreboard.clear();

        chatMessages.push({
            type: "notification",
            text: "Scores cleared"
        });
    });

    type ScoreData = {
        open: boolean;
        bonus: boolean;
        scoreType: "correct" | "incorrect" | "penalty";
        playerId: string;
        teamId: string;
        category: Category;
        number: number;
    };

    socket.on("scoreChange", ({ open, scoreType, playerId, teamId, bonus, category, number }: ScoreData) => {
        const team = teams[teamId];

        if (!team) {
            return;
        }

        if (scoreType === "correct") {
            if (bonus) {
                gameStore.scoreboard.correctBonus(number, teamId, category);
                if (visualBonus.window) {
                    visualBonus.window.close();
                    visualBonus.url = null;
                    visualBonus.window = null;
                }
            } else {
                gameStore.scoreboard.correctTossup(number, playerId, teamId, category);
            }

            chatMessages.push({
                type: "success",
                text: `Correct answer (${(category[0] || "").toUpperCase() + category.slice(1)})`
            });
        } else if (scoreType === "incorrect") {
            if (bonus) {
                gameStore.scoreboard.incorrectBonus(number, teamId, category);
                if (visualBonus.window) {
                    visualBonus.window.close();
                    visualBonus.url = null;
                    visualBonus.window = null;
                }
            } else {
                gameStore.scoreboard.incorrectTossup(number, playerId, teamId, category);
            }

            chatMessages.push({
                type: "warning",
                text: "Incorrect answer"
            });
        } else if (scoreType === "penalty") {
            if (!bonus) {
                gameStore.scoreboard.penalty(number, playerId, teamId, category);
            }

            chatMessages.push({
                type: "warning",
                text: "Penalty applied"
            });
        }

        if (open && game.state.currentQuestion) {
            if (myMember.team && game.state.buzzedTeamIds.includes(myMember.team.id)) {
                gameStore.openQuestion(false);
            } else {
                gameStore.openQuestion(true);
            }
        } else {
            timerStore.end();
            gameStore.clearQuestion();
        }
    });

    socket.on("deadQuestion", (number: number, category: Category) => {
        gameStore.scoreboard.dead(number, category);
        timerStore.end();
        gameStore.clearQuestion();
        chatMessages.push({
            type: "warning",
            text: "Question marked dead"
        });
    });

    socket.on(
        "tossupEdit",
        (number: number, playerId: string, teamId: string, category: Category, scoreType: ScoreType | "none") => {
            gameStore.scoreboard.editTossup(number, playerId, teamId, category, scoreType);
        }
    );

    socket.on("bonusEdit", (number: number, teamId: string, scoreType: "correct" | "incorrect" | "none") => {
        gameStore.scoreboard.editBonus(number, teamId, scoreType);
    });

    socket.on("questionDelete", (number: number) => {
        gameStore.scoreboard.deleteQuestion(number);
    });

    socket.on("questionOpen", (question: NewQuestionData) => {
        const buzzingEnabled =
            !question.bonus ||
            !!(
                question.teamId &&
                question.teamId === myMember.team?.id &&
                teams[question.teamId]?.captainId === myMember.id
            );
        gameStore.newQuestion(question, buzzingEnabled);

        if (!question.bonus && question.number && game.scores[question.number]) {
            gameStore.scoreboard.clearQuestion(question.number);
        }

        if (!question.bonus || !question.visual) {
            console.log("clearing");
            visualBonus.url = null;
            if (visualBonus.window)
                visualBonus.window.document.body.innerHTML = `<style>
                    img {
                        width: 100%;
                    }
                </style>
                <div></div>`;
        }

        const teamName = teams[question.bonus ? question.teamId : ""]?.name;
        if (question.number) {
            chatMessages.push({
                type: "notification",
                text:
                    `${question.bonus ? "Bonus" : "Tossup"} #${question.number} opened` +
                    (teamName ? " for " + teamName : "")
            });
        } else {
            chatMessages.push({
                type: "notification",
                text: `New ${question.bonus ? "bonus" : "tossup"} opened` + (teamName ? " for " + teamName : "")
            });
        }
    });

    socket.on("visualBonusOpen", (data: Buffer) => {
        if (myMember.moderator) return;

        const blob = new Blob([data]);
        const url = URL.createObjectURL(blob);
        visualBonus.url = url;
    });

    socket.on("timerStart", (length: number) => {
        timerStore.start(length);
        const tossupOpen = !game.state.currentQuestion?.bonus && !game.state.buzzedTeamIds.includes(myMember.team!.id);
        const bonusOpen =
            !!game.state.currentQuestion?.bonus &&
            game.state.currentQuestion?.teamId === myMember.team?.id &&
            (teams[myMember.team?.id]?.captainId === myMember.id || teams[myMember.team?.id]?.captainId === null);
        const questionOpen = !myMember.moderator && (tossupOpen || bonusOpen);
        gameStore.openQuestion(questionOpen);
    });

    socket.on("timerEnd", () => {
        if (timerStore.live) {
            timerStore.end();
            chatMessages.push({
                type: "warning",
                text: "Time is up"
            });
        }
        gameStore.stopQuestion();
    });

    socket.on("gameClockStart", (length: number) => {
        gameClockStore.start(length);
        chatMessages.push({
            type: "notification",
            text: `${Math.floor(length / 60)
                .toString()
                .padStart(2, "0")}:${(length % 60).toString().padStart(2, "0")} game clock started`
        });
    });

    socket.on("gameClockUpdate", (length: number) => {
        gameClockStore.start(length);
    });

    socket.on("gameClockPause", () => {
        gameClockStore.pause();
        chatMessages.push({
            type: "notification",
            text: "Game clock paused"
        });
    });

    socket.on("gameClockResume", () => {
        gameClockStore.resume();
        chatMessages.push({
            type: "notification",
            text: "Game clock resumed"
        });
    });

    socket.on("gameClockEnd", () => {
        gameClockStore.end();
        chatMessages.push({
            type: "notification",
            text: "Game clock ended"
        });
    });

    socket.on("gameClockStop", () => {
        gameClockStore.stop();
        chatMessages.push({
            type: "notification",
            text: "Game clock stopped"
        });
    });

    socket.on("changeCaptain", (teamId: string, memberId: string) => {
        const team = teams[teamId];
        if (!team) return;

        team.store.changeCaptain(memberId);

        const member = team.players[memberId];
        if (!member) return;

        if (
            game.state.questionState === "open" &&
            game.state.currentQuestion.bonus &&
            game.state.currentQuestion.teamId === myMember.team?.id &&
            memberId === myMember.id
        ) {
            gameStore.enableBuzzing();
        } else if (
            game.state.questionState === "open" &&
            game.state.currentQuestion.bonus &&
            game.state.currentQuestion.teamId === myMember.team?.id
        ) {
            gameStore.disableBuzzing();
        }

        chatMessages.push({
            type: "notification",
            text: member.name + " is now captain of " + team.name
        });
    });

    socket.on("kicked", () => {
        goto("/kicked");
        socket.disconnect();
    });

    socket.on("gameSwept", () => {
        goto("/swept");
        socket.disconnect();
    });

    socket.on("gameEnd", () => {
        goto("/");
        socket.disconnect();
    });

    return socket;
}

export default () => existingSocket;
