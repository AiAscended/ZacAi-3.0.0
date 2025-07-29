"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TrainingPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Training</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This section is reserved for training and model improvement features. More coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
