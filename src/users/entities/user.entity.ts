import { Entity } from 'src/shared/entity';

type UserProps = {
  id: string;
  email: string;
  password: string;
};

export class User extends Entity<UserProps> {
  // Méthode pour vérifier l'email
  isEmailValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.props.email);
  }

  // Méthode pour comparer le mot de passe (exemple basique)
  isPasswordValid(password: string): boolean {
    return this.props.password === password;
  }
}
