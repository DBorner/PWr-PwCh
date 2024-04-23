"use client";

import { promises as fs } from "fs";
import path from "path";
import { Metadata } from "next";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { GameTable } from "./game-table";
import axios, { AxiosResponse } from "axios";
import { Game } from "./types/game";
import toast from "react-hot-toast";
import { use, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { navigate } from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function GameListPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [cookies, setCookie, removeCookie] = useCookies([
    "game"
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const config = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  };
  const getGamesData = async () => {
    console.log(process.env.API_URL);
    try {
      const response: AxiosResponse<any, any> = await axios.get(
        process.env.API_URL + "/game",
        config
      );
      toast.success("Games loaded");
      setGames(response.data);
      setIsLoaded(true);
    } catch (error) {
      toast.error("Failed to load games");
      navigate("login");
      return;
    }
  };

  useEffect(() => {
    if (cookies.game !== undefined) {
      const response = axios
        .get(process.env.API_URL + `/game/${cookies.game}`, config)
        .then((response) => {
            setIsOpen(true);
        })
        .catch((error) => {
          axios.post(process.env.API_URL + "/game/quit-any", {
          }, config);
          removeCookie("game");
        });
    }
    getGamesData();
  }, [
    cookies.game,

    removeCookie,
  ]);

  const reconnect = () => {
    navigate(cookies.game);
  };

  const quitGame = async () => {
    axios.post(process.env.API_URL + "/game/quit-any", {}, config);
    removeCookie("game");
    setIsOpen(false);
  };

  return (
    <>
      <AlertDialog open={isOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reconnect to game</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            You are still connected to a game. Do you want to reconnect?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button onClick={reconnect}>Reconnect</Button>
            <Button variant={"secondary"} onClick={quitGame}>
              Cancel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoaded ? (
        <>
          <div className="flex flex-row mt-3 ml-3">
            <div className="basis-3/4">
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome back!
              </h2>
              <p className="text-muted-foreground">
                Here are list of available games
              </p>
            </div>
            <div className="basis-1/4 flex justify-end me-3">
              <ModeToggle></ModeToggle>
            </div>
          </div>
          <div className="flex flex-row m-3">
            <GameTable games={games} refresh={getGamesData}></GameTable>
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
