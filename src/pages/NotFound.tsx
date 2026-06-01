import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="text-center space-y-6">
                <BookOpen className="w-24 h-24 mx-auto text-blue-500 dark:text-blue-400" />
                <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">404</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">Oops! This page seems to be playing hooky.</p>
                <Button asChild className="mt-8">
                    <Link to="/d">Go to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}