"use client";

import { cp, promises as fs } from "fs";
import path from "path";
import { Metadata } from "next";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { GameRankingTable } from "./ranking-table";
import axios, { AxiosResponse } from "axios";
import { GameRanking } from "../types/game-ranking";
import toast from "react-hot-toast";
import { use, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { navigate } from "../actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Input } from "postcss";

export default function GameHistoryListPage() {
  const [games, setGames] = useState<GameRanking[]>([]);
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
        process.env.RANKING_API || ""
      );
      toast.success("Games ranking loaded");
      console.log(response.data.body);
      const data = JSON.parse(response.data.body);
      console.log(data);
      data.sort((a: GameRanking, b: GameRanking) => {
        return b.score - a.score;
      });
      setGames(data);
      setIsLoaded(true);
    } catch (error) {
      if (cookies.refreshToken === null || secondary) {
        toast.error("Failed to load games");
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
        });
    }
  };

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
              <p className="text-muted-foreground">Here is TicTacToe player ranking:</p>
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

          <div className="flex flex-row m-3">
            <GameRankingTable
              games={games}
              refresh={getGamesData}
            ></GameRankingTable>
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
