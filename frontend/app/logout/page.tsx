"use client";

import axios from "axios";
import { useCookies } from "react-cookie";
import { navigate } from "../actions";

export default function Logout() {
  const [cookies, setCookie, removeCookie] = useCookies([
    "game",
    "playerId",
    "accessToken",
    "refreshToken",
    "user",
  ]);

  removeCookie("game");
  removeCookie("playerId");
  const config = {
    headers: {
      Authorization: `Bearer ${cookies.accessToken}`,
    },
  };
  axios
    .post(process.env.API_URL + "/auth/logout", {}, config)
    .then()
    .catch((error) => {
      window.location.href = "/login";
    })
    .finally(() => {
      removeCookie("game");
      removeCookie("playerId");
      removeCookie("accessToken");
      removeCookie("refreshToken");
      removeCookie("user");
      navigate("login");
    });
  return <></>;
}
