"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { GameRanking } from "../types/game-ranking"
import { useCookies } from "react-cookie"

interface GameTableProps {
  games: GameRanking[];
  refresh: () => void;
}

export function GameRankingTable({ games: data, refresh }: GameTableProps) {
  const [cookies, setCookie, removeCookie] = useCookies(['game', 'playerPrivateKey', "playerPublicKey", 'accessToken',]);


  const config = {
    headers: {
      Authorization: 'Bearer ' + cookies.accessToken,
    }
  }


  return (
    <div className="w-full">
      <div className="flex items-center py-4">
      </div>
      <div className="rounded-md border">
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Player</TableHead>
          <TableHead>Wins</TableHead>
          <TableHead>Draws</TableHead>
          <TableHead>Losses</TableHead>
          <TableHead className="text-right">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((ranking) => (
          <TableRow key={ranking.player}>
            <TableCell className="font-medium">{ranking.playerName}</TableCell>
            <TableCell>{ranking.wins}</TableCell>
            <TableCell>{ranking.draws}</TableCell>
            <TableCell>{ranking.losses}</TableCell>
            <TableCell className="text-right">{ranking.score}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
      </div>
    </div>
  )
}
