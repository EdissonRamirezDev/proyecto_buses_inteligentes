import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('persons')
export class Person {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    userId: string; // ID from ms-security

    @Column()
    name: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;
}
