"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../stores/useAuthStore";

interface LoginUserMutation {
  loginUser: {
    token: string;
    user: { id: string; username: string; email: string };
  };
}

interface LoginUserVariables {
  input: { email: string; password: string };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const LOGIN_USER = gql`
  mutation LoginUser($input: LoginInput!) {
    loginUser(input: $input) {
      token
      user {
        id
        username
        email
      }
    }
  }
`;

export default function LoginPage() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();

  const [loginUser, { loading, error }] = useMutation<
    LoginUserMutation,
    LoginUserVariables
  >(LOGIN_USER, {
    onCompleted: (data) => {
      setUser(data.loginUser.user, data.loginUser.token);
      router.push("/");
    },
  });

  const onSubmit = (values: LoginUserVariables["input"]) => {
    loginUser({ variables: { input: values } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-10 bg-white shadow-lg rounded-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Вход в аккаунт
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input
            {...register("email")}
            placeholder="Email"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
          />
          <input
            {...register("password")}
            type="password"
            placeholder="Пароль"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition font-semibold"
          >
            {loading ? "Вход..." : "Войти"}
          </button>

          {error && (
            <p className="text-red-500 text-center mt-2">{error.message}</p>
          )}
        </form>

        <p className="mt-6 text-center text-gray-600">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="text-blue-500 hover:underline font-medium"
          >
            Зарегистрируйтесь
          </Link>
        </p>
      </div>
    </div>
  );
}
