import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Message } from "../../messages/entities/message.entity";
import { MessageRecipientPerson } from "../../message-recipient-persons/entities/message-recipient-person.entity";
import { GroupPerson } from "../../group-persons/entities/group-person.entity";

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

    @OneToMany(() => Message, m => m.emisor)
    mensajesEnviados: Message[];

    @OneToMany(() => MessageRecipientPerson, mrp => mrp.persona)
    mensajesRecibidos: MessageRecipientPerson[];

    @OneToMany(() => GroupPerson, gp => gp.persona)
    grupos: GroupPerson[];
}
