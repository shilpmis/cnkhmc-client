"use client";

import { useGetOrganizationAggregatedReportQuery, useGetOrganizationByIdQuery } from "@/services/OrganisationService";
import { useAuth } from "@/redux/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  IndianRupee, 
  Calendar, 
  TrendingUp, 
  Download, 
  Building2, 
  School as SchoolIcon, 
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
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
  AreaChart,
  Area
} from "recharts";
import { motion } from "framer-motion";
import { useTranslation } from "@/redux/hooks/useTranslation";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export default function OrganizationDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Org Admin should have a school_id or organization_id linked to them.
  // For this implementation, we assume the user object has the organization_id.
  const organizationId = user?.school?.organization_id;

  const { data: report, isLoading: isReportLoading } = useGetOrganizationAggregatedReportQuery(organizationId!, {
    skip: !organizationId
  });

  const { data: orgInfo, isLoading: isOrgLoading } = useGetOrganizationByIdQuery(organizationId!, {
    skip: !organizationId
  });

  if (isReportLoading || isOrgLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const studentData = report?.student_analytics?.map((item: any) => {
    const entity = orgInfo?.entities?.find(e => e.id === item.school_id);
    return {
      name: entity?.name || `Entity ${item.school_id}`,
      count: parseInt(item.count)
    };
  }) || [];

  const financialData = report?.financial_analytics?.map((item: any) => {
    const entity = orgInfo?.entities?.find(e => e.id === item.school_id);
    return {
      name: entity?.name || `Entity ${item.school_id}`,
      collected: parseFloat(item.total_collected || 0),
      receivable: parseFloat(item.total_receivable || 0)
    };
  }) || [];

  const attendanceData = report?.attendance_analytics?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    attendance: parseFloat(item.avg_attendance).toFixed(1)
  })).reverse() || [];

  const totalStudents = studentData.reduce((acc: number, curr: any) => acc + curr.count, 0);
  const totalCollected = financialData.reduce((acc: number, curr: any) => acc + curr.collected, 0);
  const totalReceivable = financialData.reduce((acc: number, curr: any) => acc + curr.receivable, 0);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="h-10 w-10 text-primary" />
            {orgInfo?.name || "Organization Dashboard"}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Consolidated analytics for {report?.entities_count || 0} entities
          </p>
        </div>
        <Button className="rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 font-bold text-lg transition-all hover:scale-[1.02]">
          <Download className="mr-2 h-6 w-6" />
          Export Reports
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Students", value: totalStudents, icon: Users, color: "blue", trend: "+12%" },
          { title: "Fee Collection", value: `₹${(totalCollected / 100000).toFixed(1)}L`, icon: IndianRupee, color: "emerald", trend: "+8%" },
          { title: "Avg Attendance", value: "94.2%", icon: Calendar, color: "purple", trend: "-2%" },
          { title: "Active Entities", value: report?.entities_count || 0, icon: SchoolIcon, color: "orange", trend: "0" },
        ].map((stat, i) => (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i}>
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : stat.trend === '0' ? 'text-slate-400' : 'text-rose-500'}`}>
                    {stat.trend.startsWith('+') ? <ArrowUpRight className="h-4 w-4" /> : stat.trend === '0' ? null : <ArrowDownRight className="h-4 w-4" />}
                    {stat.trend !== '0' && stat.trend}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{stat.title}</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Distribution */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black">Student Distribution</CardTitle>
            <Users className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial Health */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
            <CardTitle className="text-xl font-black">Fee Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Collected", value: totalCollected },
                      { name: "Pending", value: totalReceivable - totalCollected }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 w-full space-y-4">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" /> Collected
                </span>
                <span className="font-black text-slate-900">₹{(totalCollected / 100000).toFixed(2)}L</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <div className="h-3 w-3 rounded-full bg-slate-200" /> Pending
                </span>
                <span className="font-black text-slate-900">₹{((totalReceivable - totalCollected) / 100000).toFixed(2)}L</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Trends */}
        <Card className="lg:col-span-3 border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-black">Consolidated Attendance Trend (Last 30 Days)</CardTitle>
            <TrendingUp className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }} />
                <YAxis domain={[70, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="attendance" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorAttend)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
