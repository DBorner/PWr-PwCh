"use client";

import { promises as fs } from "fs";
import path from "path";
import { Metadata } from "next";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { GameHistoryTable } from "./history-table";
import axios, { AxiosResponse } from "axios";
import { GameHistory } from "../types/game-history";
import toast from "react-hot-toast";
import { use, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { navigate } from "../actions";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Input } from "postcss";

export default function GameHistoryListPage() {
  const [games, setGames] = useState<GameHistory[]>([]);
  const [cookies, setCookie, removeCookie] = useCookies([
    "game",
    "accessToken",
    "refreshToken",
    "user",
  ]);
  const [isLoaded, setIsLoaded] = useState(false);
  let config = {
    headers: {
      Authorization: `Bearer ${cookies.accessToken}`,
    },
  };
  const getGamesData = async (secondary: boolean = false) => {
    try {
      const response: AxiosResponse<any, any> = await axios.get(
        process.env.API_URL + "/game/history",
        config
      );
      toast.success("Games history loaded");
      setGames(response.data);
      setIsLoaded(true);
    } catch (error) {
      if (cookies.refreshToken === null || secondary) {
        toast.error("Failed to load games");
        navigate("login");
        return;
      }
      await axios
        .post(process.env.API_URL + "/auth/refreshToken", {
          refreshToken: cookies.refreshToken,
          name: cookies.user,
        })
        .then((response) => {
          const data = response.data;
          setCookie("accessToken", data.idToken.jwtToken);
          setCookie("refreshToken", data.refreshToken.token);
          config = {
            headers: {
              Authorization: `Bearer ${cookies.accessToken}`,
            },
          };
          toast.success("Token refreshed");
          return getGamesData(true);
        })
        .catch((error) => {
          toast.error("Failed to load games");
          navigate("logout");
        });
    }
  };

  const getNumberOfWins = () => {
    let wins = 0;
    games.forEach((game) => {
        const winnerName = game.player1 === game.winner ? game.player1Name : game.player2 === game.winner ? game.player2Name : null;
        console.log(winnerName);
        if (winnerName === cookies.user) {
        wins++;
      }
    });
    return wins;
  }

  const getNumberOfDraws = () => {
    let draws = 0;
    games.forEach((game) => {
      if (game.status === "draw") {
        draws++;
      }
    });
    return draws;
    }

    const getNumberOfLosses = () => {
    let losses = 0;
    games.forEach((game) => {
        const winnerName = game.player1 === game.winner ? game.player1Name : game.player2 === game.winner ? game.player2Name : null;
        if (winnerName !== cookies.user && winnerName !== null) {
        losses++;
      }
    });
    return losses;
    }

    useEffect(() => {
        getGamesData();
    }, []);

  return (
    <>
      {isLoaded ? (
        <>
          <div className="flex flex-row mt-3 ml-3">
            <div className="basis-3/4">
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome back {cookies.user}!
              </h2>
              <p className="text-muted-foreground">
                Here are history of your games
              </p>
            </div>
            <div className="basis-1/4 flex justify-end me-3">
              <Button
                variant={"ghost"}
                className="mr-4"
                onClick={() => {
                  navigate("/");
                }}
              >
                Games
              </Button>
              <Button
                variant={"ghost"}
                className="mr-4"
                onClick={() => {
                  navigate("logout");
                }}
              >
                Logout
              </Button>
              <ModeToggle></ModeToggle>
            </div>
          </div>
         
        <div className="flex justify-center m-3">
            <Card className=" m-3">
                <CardHeader>
                    <CardTitle>Total games</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{games.length}</div>
                </CardContent>
                </Card>
                <Card className="m-3">
                <CardHeader>
                    <CardTitle>Total wins</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{getNumberOfWins()}</div>
                </CardContent>
                </Card>
                <Card className="m-3">
                <CardHeader>
                    <CardTitle>Total draws</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{getNumberOfDraws()}</div>
                </CardContent>
                </Card>
                <Card className="m-3">
                <CardHeader>
                    <CardTitle>Total losses</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{getNumberOfLosses()}</div>
                </CardContent>
                </Card>
          </div>
          <div className="flex flex-row m-3">
            <GameHistoryTable
              games={games}
              refresh={getGamesData}
            ></GameHistoryTable>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-screen">
          <div className="loader"></div>
        </div>
      )}
    </>
  );
}
