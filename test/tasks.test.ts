import request from 'supertest';

import app from '../src/app';
import { clear } from '../src/database/task-db';
import { AutomationTask } from '../src/types';


describe('/automation/', () => {
  const task: AutomationTask = {
    _id: 'test-task',
    ref: 'testing',
    title: 'Test Task',
    source: 'jesttasktest',
    message: 'hello this is task',
    status: 'Created',
  };

  beforeEach(async (done) => {
    await clear();
    done();
  });

  it('should read empty database', async () => {
    const res = await request(app)
      .get('/automation/tasks');
    expect(res.status).toEqual(200);
    expect(res.body).toEqual([]);
  });

  it('should create task', async () => {
    let res = await request(app)
      .put('/automation/tasks')
      .send(task);

    expect(res.status).toEqual(201);
    expect(res.body).toMatchObject(task);

    res = await request(app)
      .get('/automation/tasks');

    expect(res.status).toEqual(200);
    expect(res.body).toMatchObject([task]);
  });

  it('should fail to create multiple tasks', async () => {
    let res = await request(app)
      .put('/automation/tasks')
      .send(task);

    expect(res.status).toEqual(201);

    res = await request(app)
      .put('/automation/tasks')
      .send(task);

    expect(res.status).toBeGreaterThan(400);
    res.body;
  });
});
