"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { navigate } from "@/app/actions";
import toast from "react-hot-toast";
import { useCookies } from "react-cookie";
import { set } from "react-hook-form";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [cookies, setCookie, removeCookie] = useCookies([
    "refreshToken",
    "accessToken",
    "user"
  ]);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);
    const form = event.currentTarget as HTMLFormElement;
    const name = (form.elements.namedItem("username") as HTMLInputElement)
      .value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    try {
      await fetch(process.env.API_URL + "/auth/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, password }),
      })
        .catch((error) => {
          const data = error.json();
          toast.error(data.message);
          setIsLoading(false);
        })
        .then((response) => {
          if (response instanceof Response && response.ok) {
            toast.success("Logged in successfully");
            response.json().then((data) => {
              setCookie("accessToken", data.idToken.jwtToken);
              setCookie("refreshToken", data.refreshToken.token);
              setCookie("user", data.idToken.payload.nickname);
              navigate("");
            });
          } else {
            (response as Response).json().then((data) => {
              toast.error(data.message);
            });
          }
          setIsLoading(false);
        });
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit} id="sign-up">
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="username">
              Username
            </Label>
            <Input
              id="username"
              placeholder="Username"
              type="text"
              autoCapitalize="none"
              autoComplete="name"
              required={true}
              autoCorrect="off"
              disabled={isLoading}
            />
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              placeholder="Password"
              type="password"
              required={true}
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
              disabled={isLoading}
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Login
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or if you don't have an account
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={() => {
          navigate("register");
        }}
      >
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.login className="mr-2 h-4 w-4" />
        )}{" "}
        Sign up with Email
      </Button>
    </div>
  );
}
