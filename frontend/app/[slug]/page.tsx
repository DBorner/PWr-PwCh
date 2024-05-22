"use client";

import Board from "./components/board";
import { TicTacToeBoard } from "@/app/types/game";
import { Game } from "@/app/types/game";
import { SetStateAction, use, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCookies } from "react-cookie";
import { navigate } from "../actions";
import { socket } from "../service/socket";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/theme-toggle";
import ConfettiExplosion from "react-confetti-explosion";
import { date } from "zod";

function timeout(delay: number) {
  return new Promise((res) => setTimeout(res, delay));
}

export default function Page({ params }: { params: { slug: string } }) {
  const [cookies, setCookie, removeCookie] = useCookies(["game", "playerId", "accessToken", "refreshToken", "user"]);
  const [gameData, setGameData] = useState<Game | null>(null);
  const [board, setBoard] = useState<TicTacToeBoard | null>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tryCount, setTryCount] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [player1Image, setPlayer1Image] = useState<string>("no_img.jpg");
  const [player2Image, setPlayer2Image] = useState<string>("no_img.jpg");

  let config = {
    headers: {
      Authorization: `Bearer ${cookies.accessToken}`,
    },
  };

  let timestamp = new Date().getTime();


  if (cookies.playerId === undefined) {
    axios
      .get(`${process.env.API_URL}/game/player-id`, config)
      .then((response) => {
        setCookie("playerId", response.data.playerId);
      });
  }

  const getUserImageFromS3 = async () => {
    if(gameData?.player2Name != null){
      setPlayer2Image(`https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${gameData?.player2Name}.jpg`)
    } else {
      setPlayer2Image("noimg.gif")
    }
    if(gameData?.player1Name != null){
      setPlayer1Image(`https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${gameData?.player1Name}.jpg`)
    } else {
      setPlayer1Image("noimg.gif")
    }
  };

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function connectToGame() {
      console.log("Connecting to game");
      socket.connect();
      socket.emit("joinGame", params.slug);
    }

    async function onGameUpdate(secondary: boolean = false) {
        await getGameData(secondary);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("gameUpdated", onGameUpdate);
    socket.on("playerJoined", onGameUpdate);
    socket.on("playerLeft", onGameUpdate);
    connectToGame();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("updateGame", onGameUpdate);
    };
  }, [params.slug]);

  const getGameData = async (secondary: boolean = false) => {
    console.log("Getting game data");
    await fetch(`${process.env.API_URL}/game/${params.slug}`, config)
      .catch((error) => {
        console.error(error);
      })
      .then(async (response) => {
        if (response instanceof Response && !response.ok) {
        console.log("Notok");
        if (cookies.refreshToken === null) {
            console.log("Failed to load game");
            toast.error("Failed to load game");
            navigate("/");
            return;
        }
          axios
            .post(process.env.API_URL + "/auth/refreshToken", {
              refreshToken: cookies.refreshToken,
              name: cookies.user,
            })
            .then(async (response) => {
                console.log(response)
              const data = response.data;
              setCookie("accessToken", data.idToken.jwtToken);
              setCookie("refreshToken", data.refreshToken.token);
              config = {
                headers: {
                  Authorization: `Bearer ${cookies.accessToken}`,
                },
              };
              toast.success("Token refreshed");
              getGameData(true);
            })
            .catch((error) => {
              console.log(error);
              toast.error("Failed to load game");
            });
        } else {
            const data = await (response as Response).json();
            setGameData(data);
            setBoard(data.board);
            if (
                data.status === "winner" &&
                data.currentPlayer === cookies.playerId
            ) {
                setConfetti(true);
            } else {
                setConfetti(false);
            }
            setIsLoaded(true);
        }
      });
  };

  useEffect(() => {
    if (gameData !== null) {
      getUserImageFromS3();
    }
  }
  , [gameData]);

  const makeMove = async (row: number, column: number) => {
    const response = await axios
      .post(
        `${process.env.API_URL}/game/${params.slug}/move`,
        {
          row: row,
          column: column,
        },
        config
      )
      .catch((error) => {
        toast.error(error.response.data.message);
      });
    if (response) {
      const data = await response.data;
      if (data.status === "winner" && data.currentPlayer === cookies.playerId) {
        setConfetti(true);
      } else {
        setConfetti(false);
      }
      setGameData(data);
      setBoard(data.board);
      socket.emit("updateGame", params.slug);
    }
  };
  

  const restartGame = async () => {
    const response = await axios
      .post(`${process.env.API_URL}/game/${params.slug}/restart`, {}, config)
      .catch((error) => {
        toast.error(error.response.data.message);
      });
    if (response) {
      const data = await response.data;
      setGameData(data);
      setBoard(data.board);
      socket.emit("updateGame", params.slug);
    }
  };

  const quitGame = async () => {
    const response = await axios
      .post(`${process.env.API_URL}/game/${params.slug}/quit`, {}, config)
      .catch(async (error) => {
        if (tryCount < 3) {
          setTryCount(tryCount + 1);
          await timeout(1000);
          quitGame();
          return;
        }
        removeCookie("game");
        removeCookie("playerId");
        socket.emit("leaveGame", params.slug);
        navigate("/");
      })
      .then(() => {
        removeCookie("game");
        removeCookie("playerId");
        socket.emit("leaveGame", params.slug);
        navigate("/");
      });
  };

  useState(() => {
    getGameData();
  });

  return (
    <>
      <div className="h-screen">
        <div className="flex flex-row mt-3 ml-3">
          <div className="basis-3/4">
            <h2 className="text-2xl font-bold tracking-tight">Tic Tac Toe</h2>
          </div>
          <div className="basis-1/4 flex justify-end me-3">
            <ModeToggle></ModeToggle>
          </div>
        </div>
        <div className="flex h-3/4 items-center justify-center">
          {isLoaded ? (
            <>
              {gameData?.status === "winner" && (
                <AlertDialog defaultOpen={true}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {gameData.currentPlayer === gameData.player1pub
                          ? "Player 1 (" + gameData.player1Name + ") has won!"
                          : "Player 2 (" + gameData.player2Name + ") has won!"}
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <Button variant={"secondary"} onClick={quitGame}>
                        Back to home
                      </Button>
                      {gameData.currentPlayer === cookies.playerId && (
                        <Button onClick={restartGame}>Play again</Button>
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {gameData?.status === "draw" && (
                <AlertDialog defaultOpen={true}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>It&apos;s a draw!</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <Button variant={"secondary"} onClick={quitGame}>
                        Back to home
                      </Button>
                      {gameData.currentPlayer === cookies.playerId && (
                        <Button onClick={restartGame}>Play again</Button>
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Card className="w-[700px]">
                <CardHeader>
                  <CardTitle>
                    <div className="flex justify-between">
                      {gameData !== null && gameData.name}
                      <div>
                        <Badge variant="default">
                          {gameData?.status === "winner"
                            ? "Winner"
                            : gameData?.status === "draw"
                            ? "Draw"
                            : gameData?.status === "in-progress"
                            ? "In progress"
                            : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardDescription className="ms-3"></CardDescription>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div className="justify-items-start text-left">
                      <div className="flex items-center">
                        <Avatar>
                          <AvatarImage src={player1Image + `?${timestamp}`} />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <h3 className="text-2xl font-bold tracking-tight px-2">
                          {gameData?.player1Name != null
                            ? gameData.player1Name
                            : "N/A"}
                        </h3>
                      </div>
                      <p className="text-muted-foreground">Player 1</p>
                    </div>
                    <div className="text-center place-self-center">
                      {confetti && (
                        <ConfettiExplosion
                          force={0.7}
                          duration={2700}
                          particleCount={200}
                          width={1600}
                        />
                      )}
                      {gameData?.status === "in-progress" &&
                        (gameData?.currentPlayer === cookies.playerId
                          ? "Your turn"
                          : "Opponent's turn")}
                    </div>
                    <div className="justify-items-end text-right">
                      <div className="flex justify-end items-center">
                        <h3 className="text-2xl font-bold tracking-tight px-2">
                          {gameData?.player2Name != null
                            ? gameData.player2Name
                            : "N/A"}
                        </h3>
                        <Avatar>
                          <AvatarImage src={player2Image + `?${timestamp}`} />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                      </div>
                      <p className="text-muted-foreground">Player 2</p>
                    </div>
                  </div>
                  {board !== null && (
                    <Board
                      board={board}
                      makeMove={makeMove}
                      isPlayerTurn={
                        gameData?.currentPlayer === cookies.playerId
                      }
                    />
                  )}
                </CardContent>
                <CardFooter>
                  <div className="w-full flex justify-between">
                    {isConnected ? (
                      <Badge variant="default">Connected</Badge>
                    ) : (
                      <Badge variant="destructive">
                        Disconnected, try to refresh
                      </Badge>
                    )}
                    <Button variant="secondary" onClick={quitGame}>
                      Quit game
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </>
  );
}
