import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

import { ShieldAlert } from "lucide-react"

export default function Unauthorized() {

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="text-center space-y-6">
                <ShieldAlert className="w-24 h-24 mx-auto text-red-500 dark:text-red-400" />
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Unauthorized Access</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">

                    Sorry, you don't have permission to access this area.
                </p>
                <Button asChild variant="outline" className="mt-8">
                    <Link to="/d">Return to Dashboard</Link>
                </Button>
            </div>
        </div>

    )

}

