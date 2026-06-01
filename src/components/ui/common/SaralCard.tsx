import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const SaralCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({
    title,
    description,
    children,
}) => (
    <Card className="mb-4">
        <CardHeader className="p-4">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4">{children}</CardContent>
    </Card>
)

