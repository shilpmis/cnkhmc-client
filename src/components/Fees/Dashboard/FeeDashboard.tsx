"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { DollarSign, Users, Clock, AlertTriangle } from "lucide-react"
import { useTranslation } from "@/redux/hooks/useTranslation"

const feeCollectionData = [
  { month: "Apr", amount: 120000 },
  { month: "May", amount: 150000 },
  { month: "Jun", amount: 180000 },
  { month: "Jul", amount: 170000 },
  { month: "Aug", amount: 160000 },
  { month: "Sep", amount: 190000 },
  { month: "Oct", amount: 200000 },
  { month: "Nov", amount: 210000 },
  { month: "Dec", amount: 180000 },
  { month: "Jan", amount: 170000 },
  { month: "Feb", amount: 190000 },
  { month: "Mar", amount: 220000 },
]

const feeStatusData = [
  { name: "Paid", value: 65, color: "#10b981" },
  { name: "Pending", value: 20, color: "#f59e0b" },
  { name: "Overdue", value: 15, color: "#ef4444" },
]

const COLORS = ["#10b981", "#f59e0b", "#ef4444"]

export const FeeDashboard: React.FC = () => {
  const {t} = useTranslation()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">{t("fee_management_dashboard")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t("total_collected")}</p>
                <h3 className="text-2xl font-bold">₹24,50,000</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t("pending")}</p>
                <h3 className="text-2xl font-bold">₹8,20,000</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t("overdue")}</p>
                <h3 className="text-2xl font-bold">₹5,30,000</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{t("total_students")}</p>
                <h3 className="text-2xl font-bold">1,250</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("fee_collection_trend")}</CardTitle>
            <CardDescription>{t("monthly_fee_collection_for_the_current_academic_year")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeCollectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                  <Bar dataKey="amount" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("fee_status")}</CardTitle>
            <CardDescription>{t("overall_fee_payment_status")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feeStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {feeStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle>{t("recent_fee_collections")}</CardTitle>
          <CardDescription>{t("latest_fee_transactions")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FeeCollectionTable />
        </CardContent>
      </Card> */}
    </div>
  )
}

