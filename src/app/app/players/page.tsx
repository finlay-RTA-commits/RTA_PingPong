
'use client';

import { useState } from 'react';
import type { Player } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlayers } from '@/hooks/use-players';
import { useAuth } from '@/hooks/use-auth';

export default function PlayersPage() {
  const { players, addPlayer, updatePlayer, removePlayer } = usePlayers();
  const { user } = useAuth();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [actionToConfirm, setActionToConfirm] = useState<{ type: 'edit' | 'delete', player: Player } | null>(null);
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const ADMIN_PASSWORD = 'rtapingpong1';

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const avatar = formData.get('avatar') as string || 'https://placehold.co/40x40.png';

    if (!name) {
      toast({ variant: 'destructive', title: 'Error', description: 'Player name is required.' });
      return;
    }

    if (editingPlayer) {
      await updatePlayer({ ...editingPlayer, name, avatar, email });
      toast({ title: 'Player Updated', description: `${name} has been updated.` });
    } else {
      await addPlayer(name, avatar, email); // email can be blank
      toast({ title: 'Player Added', description: `${name} has been added to the roster.` });
    }

    setEditingPlayer(null);
    setIsFormDialogOpen(false);
  };

  const handleEditRequest = (player: Player) => {
    setActionToConfirm({ type: 'edit', player });
    setIsAuthDialogOpen(true);
  };

  const handleDeleteRequest = (player: Player) => {
    setActionToConfirm({ type: 'delete', player });
    setIsAuthDialogOpen(true);
  };

  const handlePasswordConfirm = async () => {
    if (password !== ADMIN_PASSWORD) {
      toast({ variant: 'destructive', title: 'Authentication Failed', description: 'Incorrect password.' });
      return;
    }

    if (actionToConfirm?.type === 'edit') {
      setEditingPlayer(actionToConfirm.player);
      setIsFormDialogOpen(true);
    } else if (actionToConfirm?.type === 'delete') {
      if(actionToConfirm.player.uid === user?.uid) {
         toast({ variant: 'destructive', title: 'Action Denied', description: 'You cannot remove your own player profile via this admin panel. Please use the profile page.' });
      } else {
        await removePlayer(actionToConfirm.player.id);
        toast({ title: 'Player Removed', description: `${actionToConfirm.player.name} has been removed.` });
      }
    }

    handleAuthDialogClose();
  };

  const handleAuthDialogClose = () => {
    setIsAuthDialogOpen(false);
    setActionToConfirm(null);
    setPassword('');
  };

  const handleAddNewClick = () => {
    setEditingPlayer(null);
    setIsFormDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Players</h1>
          <p className="text-muted-foreground">
            Add, edit, or remove players from the roster.
          </p>
        </div>
        <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
          setIsFormDialogOpen(isOpen);
          if (!isOpen) {
            setEditingPlayer(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNewClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Player
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleFormSubmit}>
              <DialogHeader>
                <DialogTitle>{editingPlayer ? 'Edit Player' : 'Add New Player'}</DialogTitle>
                <DialogDescription>
                  {editingPlayer
                    ? `Update the details for ${editingPlayer.name}.`
                    : 'Fill in the details for the new player.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Player Name</Label>
                  <Input id="name" name="name" defaultValue={editingPlayer?.name} required />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingPlayer?.email} placeholder="player@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input id="avatar" name="avatar" defaultValue={editingPlayer?.avatar} placeholder="https://placehold.co/40x40.png" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" onClick={() => setEditingPlayer(null)}>Cancel</Button>
                </DialogClose>
                <Button type="submit">{editingPlayer ? 'Save Changes' : 'Add Player'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Roster</CardTitle>
          <CardDescription>
            The list of all registered players.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead className="text-center">Wins</TableHead>
                <TableHead className="text-center">Losses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players
                .map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={player.avatar} alt={player.name} data-ai-hint="person portrait"/>
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{player.wins}</TableCell>
                    <TableCell className="text-center">{player.losses}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditRequest(player)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRequest(player)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Admin Authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter the admin password to {actionToConfirm?.type} this player.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input 
              id="admin-password" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordConfirm()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleAuthDialogClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
