"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../stores/useAuthStore";

interface RegisterUserMutation {
  registerUser: {
    token: string;
    user: { id: string; username: string; email: string };
  };
}

interface RegisterUserVariables {
  input: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  };
}

const registerSchema = z.object({
  username: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterInput!) {
    registerUser(input: $input) {
      token
      user {
        id
        username
        email
      }
    }
  }
`;

export default function RegisterPage() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();

  const [registerUser, { loading, error }] = useMutation<
    RegisterUserMutation,
    RegisterUserVariables
  >(REGISTER_USER, {
    onCompleted: (data) => {
      setUser(data.registerUser.user, data.registerUser.token);
      router.push("/");
    },
  });

  const onSubmit = (values: RegisterUserVariables["input"]) => {
    registerUser({ variables: { input: values } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-10 bg-white shadow-lg rounded-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Регистрация
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            {...register("username")}
            placeholder="Username"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 text-gray-900"
          />
          <input
            {...register("firstName")}
            placeholder="Имя"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 text-gray-900"
          />
          <input
            {...register("lastName")}
            placeholder="Фамилия"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 text-gray-900"
          />
          <input
            {...register("email")}
            placeholder="Email"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 text-gray-900"
          />
          <input
            {...register("password")}
            type="password"
            placeholder="Пароль"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 text-gray-900"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition font-semibold"
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>

          {error && (
            <p className="text-red-500 text-center mt-2">{error.message}</p>
          )}
        </form>

        <p className="mt-6 text-center text-gray-600">
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="text-green-500 hover:underline font-medium"
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
