"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "Jan",
    total: 12,
  },
  {
    name: "Feb",
    total: 18,
  },
  {
    name: "Mar",
    total: 24,
  },
  {
    name: "Apr",
    total: 32,
  },
  {
    name: "May",
    total: 28,
  },
  {
    name: "Jun",
    total: 22,
  },
  {
    name: "Jul",
    total: 15,
  },
  {
    name: "Aug",
    total: 20,
  },
  {
    name: "Sep",
    total: 25,
  },
  {
    name: "Oct",
    total: 30,
  },
  {
    name: "Nov",
    total: 35,
  },
  {
    name: "Dec",
    total: 15,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

