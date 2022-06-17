import 'reflect-metadata';
import { container } from 'tsyringe';
import Application from './application/Application';

container.resolve(Application).launch();
