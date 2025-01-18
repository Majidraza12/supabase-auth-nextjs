"use server";
// Use server to run on the server side
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  // Create credentials from the form data
  const credentials = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Sign up the user in Supabase
  const { error, data } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        username: credentials.username,
      },
    },
  });

  if (error) {
    return { status: error?.message, user: null };
  } else if (data?.user) {
    // Check if the user has identities (external logins)
    if (data.user.identities?.length === 0) {
      return { status: "Email already registered", user: null };
    }

    // Revalidate the path (for page refresh)
    revalidatePath("/", "layout");

    return {
      status: "Success",
      data: data?.user,
      session: data?.session, // Optional: Only if session data is required
    };
  }

  return { status: "Something went wrong", user: null };
}
export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const { error, data } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (error) {
    return { status: error?.message, user: null };
  } else if (data?.user) {
    return { status: "Success", user: data?.user };
    }
    //Todo : create user Interface in user_profile table -> what we here are doing the we are creating a user in the user_profile table when the user login for the first time , therefore first we need to check if the user is already in the user_profile table , if not then we need to create a user in the user_profile table
    const { data: existingUser } = await supabase.from("user_profiles").select("*").eq("email", credentials?.email).limit(1).single();
    //select only one row from the user_profile stable
    if (!existingUser) {
        const { error: insertError, data : user } = await supabase.from("user_profiles").insert({
        email: data?.user.email,
        username: data?.user?.user_metadata?.username,
        });
        if (insertError) {
            return { status: insertError?.message, user: null };
        }
        return { status: "Success", user: user };

    }


    // Revalidate the path (for page refresh)
    revalidatePath("/", "layout")
    return { status: "success", user: data?.user };
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
  return { status: "Success", user: null };
}
export async function getUserSession() {
  const supabase = await createClient();
  const { data,error } = await supabase.auth.getUser();
  if (error) {
    return { status: error?.message, user: null };
  }
  return { status: "Success", user: data?.user };
}
//we we are using mulitple providers for OAuthSignIn we can just pass the provider name as a parameter to the function when we call it
export async function signInWithGithub() {
    //to get the URL dynamically
    const origin = (await headers())?.get("origin")
    const supabase = await createClient();
    const { data,error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
  });
    if (error) {
        redirect("/error");
        return { status: error?.message, user: null };
    }else if ( data.url) {
        redirect(data.url);
    }
    //As we the user logins manually for the first time we need to create a user in the user_profile table so therefore we need to it when the user logins with github , for that we will do that in the callback -> route.ts file
}
export async function forgotPassword(formData: FormData) {
    const origin = (await headers())?.get("origin");
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const {  error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
    });
    if (error) {
        return { status: error?.message, user: null };
    }
    return { status: "Success" };
}
export async function resetPassword(formData: FormData, code: string) {
    const supabase = await createClient();
    const { error: CodeError } = await supabase.auth.exchangeCodeForSession(code);
    if (CodeError) {
        alert("Invalid OTP");
        return { status: CodeError?.message, user: null };
        return { status: "Success" };
    }
    const {error} = await supabase.auth.updateUser({password : formData.get("password") as string});
    if (error) {
        return { status: error?.message, user: null };
    }
    return { status: "Success" };
}
