"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../components/Form/authSchemas";
import { useMutation } from "@apollo/client/react";
import { LOGIN_USER } from "../../graphql/mutation";
import { useAuthStore } from "../../stores/useAuthStore";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginFormData = {
  email: string;
  password: string;
};

type LoginUserResponse = {
  loginUser: {
    token: string;
    user: {
      id: string;
      email: string;
      username: string;
    };
  };
};

type LoginUserVariables = {
  input: LoginFormData;
};

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const [loginUser, { loading, error }] = useMutation<
    LoginUserResponse,
    LoginUserVariables
  >(LOGIN_USER);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await loginUser({ variables: { input: data } });
      if (!res.data) return;

      const token = res.data.loginUser.token;
      const user = res.data.loginUser.user;

      setUser(user, token);
      router.push("/");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-indigo-200">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Вход в Chat App
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Введите email"
              {...register("email")}
              className={`w-full p-3 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                {...register("password")}
                className={`w-full p-3 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "Скрыть" : "Показать"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Вход..." : "Войти"}
          </button>

          {error && <p className="text-red-500 text-center mt-2">{error.message}</p>}
        </form>

        <p className="text-center text-gray-600 mt-4">
          Нет аккаунта?{" "}
          <span
            onClick={() => router.push("/register")}
            className="text-blue-500 font-medium hover:underline cursor-pointer"
          >
            Зарегистрироваться
          </span>
        </p>
      </div>
    </div>
  );
}
