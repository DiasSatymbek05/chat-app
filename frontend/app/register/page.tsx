"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../components/Form/authSchemas";
import { useMutation } from "@apollo/client/react";
import { REGISTER_USER } from "../../graphql/mutation";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RegisterFormData = {
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  password: string;
};

type RegisterUserResponse = {
  registerUser: {
    id: string;
    email: string;
    username: string;
  };
};

type RegisterUserVariables = {
  input: RegisterFormData;
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const [registerUser, { loading, error }] = useMutation<
    RegisterUserResponse,
    RegisterUserVariables
  >(REGISTER_USER);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = await registerUser({ variables: { input: data } });
      if (!res.data) return;

      router.push("/login");
    } catch (err) {
      console.error("Register error:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-gradient-to-r from-blue-100 to-indigo-200 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Регистрация
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Username</label>
            <input
              type="text"
              placeholder="Введите username"
              {...register("username")}
              className={`w-full p-3 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.username ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>

          {/* First Name */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Имя</label>
            <input
              type="text"
              placeholder="Введите имя"
              {...register("firstName")}
              className={`w-full p-3 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.firstName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Фамилия</label>
            <input
              type="text"
              placeholder="Введите фамилию"
              {...register("lastName")}
              className={`w-full p-3 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.lastName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Дата рождения</label>
            <input
              type="date"
              {...register("dateOfBirth")}
              className="w-full p-3 text-black border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Введите email"
              {...register("email")}
              className={`w-full p-3 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Пароль</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Введите пароль"
                {...register("password")}
                className={`w-full p-3 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
              >
                {showPassword ? "Скрыть" : "Показать"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>

          {error && <p className="text-red-500 text-center mt-2">{error.message}</p>}
        </form>

        <p className="text-center text-gray-600 mt-4 text-sm">
          Уже есть аккаунт?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-blue-500 font-medium hover:underline cursor-pointer"
          >
            Войти
          </span>
        </p>
      </div>
    </div>
  );
}
