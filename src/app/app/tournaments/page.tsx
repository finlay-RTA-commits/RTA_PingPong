import Image from "next/image";
import { tournaments } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, PlusCircle, Users } from "lucide-react";

export default function TournamentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-muted-foreground">
            Browse and manage all official RTA PingPong tournaments.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
              <DialogDescription>
                Fill in the details below to set up a new tournament.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input id="name" placeholder="e.g., Summer Slam 2024" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Start Date</Label>
                <Input id="date" type="date" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="flex flex-col">
            <CardHeader>
               <div className="aspect-video overflow-hidden rounded-md border">
                <Image
                  src={tournament.imageUrl}
                  alt={tournament.name}
                  width={600}
                  height={400}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                  data-ai-hint="ping pong"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardTitle>{tournament.name}</CardTitle>
              <CardDescription className="mt-2 flex flex-col gap-2">
                 <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {tournament.date}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> {tournament.participants} participants
                </span>
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="secondary">View Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
