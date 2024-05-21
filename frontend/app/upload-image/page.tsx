"use client";

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { navigate } from "../actions";
import { useState } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import { set } from "react-hook-form";
import toast from "react-hot-toast";



export default function Image() {
    const API = process.env.API_URL;
    const [cookies, setCookie, removeCookie] = useCookies(["game", "accessToken", "refreshToken", "user"]);
    const [isLoading, setIsLoading] = useState(false);
      
    const [image, setImage] = useState();
  
    let config = {
        headers: {
        Authorization: `Bearer ${cookies.accessToken}`,
        },
    };
    const handleCancel = () => {
        console.log("Cancel button clicked");
        navigate("/");
    }

    const handleUpdate = async () => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", image);
        try {
            const resonse = await axios.post(API + "/auth/upload", formData, config)
            if (resonse.status == 201) {
            console.log("Image uploaded");
            toast.success("Image uploaded");
            navigate("/");
        } else {
            console.log("Error uploading image");
            toast.error("Error uploading image");
            setIsLoading(false);
        }
        } catch (error) {
            console.log("Error uploading image");
            toast.error("Error uploading image");
            setIsLoading(false);
        }
    }

  return (
    <>
        <div className="flex flex mt-3 ml-3 justify-center">
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Image upload</CardTitle>
        <CardDescription>Change your profile picture in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
             <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">Picture</Label>
      <Input id="picture" type="file" onChange={(e) => {
        if (e.target.files == null || e.target.files.length == 0) {
          return;
        }
        setImage(e.target.files[0]);
      }} />
    </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancel} disabled={isLoading}>Cancel</Button>
        <Button onClick={handleUpdate} disabled={isLoading}>Update</Button>
      </CardFooter>
    </Card>
    </div>
    </>
  );
}
