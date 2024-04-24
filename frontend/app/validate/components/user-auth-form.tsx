"use client";

import * as React from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Label } from "@/components/ui/label";
import { navigate } from "@/app/actions";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import toast from "react-hot-toast";
import { z } from "zod";
import { useCookies } from "react-cookie";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
});

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [cookies, setCookie, removeCookie] = useCookies(['user']);


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    const pin = data.pin;
    console.log(pin)
    const body = {
      code: pin,
      name: cookies.user,
    }
    toast.promise(
      fetch(process.env.API_URL + "/auth/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
        .then((response) => {
          if (response.ok) {
            toast.success("Code verified");
            navigate("login");
          } else {
            return response.json().then((data) => {
              setIsLoading(false);
              throw new Error(data.message);
            });
          }
        })
        .catch((error) => {
          setIsLoading(false);
          throw new Error(error.message);
        }),
      {
        loading: "Verifying code...",
        success: "Code verified",
        error: (error) => error.message,
      }
    );
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} id="sign-up">
          <div className="grid gap-2">
            <div className="grid gap-1 justify-center pb-5">
              <Label className="sr-only" htmlFor="email">
                Code
              </Label>
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Code
            </Button>
          </div>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Code should be on your email
          </span>
        </div>
      </div>
    </div>
  );
}
