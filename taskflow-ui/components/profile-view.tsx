"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Award } from "lucide-react"

export function ProfileView() {
  return (
    <div className="h-full overflow-auto p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Profile card */}
        <Card className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src="/placeholder.svg?height=96&width=96" />
              <AvatarFallback className="text-2xl">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <h2 className="text-2xl font-semibold">John Doe</h2>
                <p className="text-sm text-muted-foreground">john.doe@example.com</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="secondary" className="gap-1">
                  <Award className="h-3 w-3" />
                  Pro Member
                </Badge>
                <Badge variant="outline">Joined Oct 2024</Badge>
              </div>
            </div>
            <Button variant="outline">Edit Profile</Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm">Total Tasks</span>
              </div>
              <p className="text-3xl font-bold">156</p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Streak</span>
              </div>
              <p className="text-3xl font-bold">12 days</p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span className="text-sm">Achievements</span>
              </div>
              <p className="text-3xl font-bold">8</p>
            </div>
          </Card>
        </div>

        {/* Settings */}
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Account Settings</h3>
              <p className="text-sm text-muted-foreground">Update your account information</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <Input id="email" type="email" defaultValue="john.doe@example.com" className="flex-1" />
                  <Button variant="outline">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Preferences</h3>
              <p className="text-sm text-muted-foreground">Customize your TaskFlow experience</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates about your tasks</p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Default Pomodoro Duration</p>
                  <p className="text-sm text-muted-foreground">Set your preferred focus time</p>
                </div>
                <Button variant="outline" size="sm">
                  25 minutes
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
