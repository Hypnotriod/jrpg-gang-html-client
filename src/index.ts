import 'reflect-metadata';
import { container } from 'tsyringe';
import AppConfig from './application/AppConfig';
import Application from './application/Application';
import appConfig from './app-config.json';

container.register(AppConfig, { useValue: appConfig });
container.resolve(Application).launch();
