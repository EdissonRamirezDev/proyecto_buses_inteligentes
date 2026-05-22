import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PersonsService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async createOrSync(createPersonDto: CreatePersonDto) {
    let person = await this.personRepository.findOne({ where: { userId: createPersonDto.userId } });
    if (!person) {
      person = this.personRepository.create(createPersonDto);
    } else {
      Object.assign(person, createPersonDto);
    }
    return await this.personRepository.save(person);
  }

  async create(createPersonDto: CreatePersonDto) {
    const person = this.personRepository.create(createPersonDto);
    return await this.personRepository.save(person);
  }

  async findAll() {
    return await this.personRepository.find();
  }

  async findOne(id: string) {
    const person = await this.personRepository.findOne({ where: { id } });
    if (!person) throw new NotFoundException(`Person #${id} not found`);
    return person;
  }

  async update(id: string, updatePersonDto: UpdatePersonDto) {
    const person = await this.findOne(id);
    const updated = Object.assign(person, updatePersonDto);
    return await this.personRepository.save(updated);
  }

  async remove(id: string) {
    const person = await this.findOne(id);
    return await this.personRepository.remove(person);
  }
}
