import{beforeEach,describe,expect,it}from'vitest';
import request from'supertest';
import fs from'node:fs/promises';
import app from'../app.js';
import{dbPath}from'../utils/db.js';

describe('Student Management API',()=>{
 beforeEach(async()=>{try{await fs.unlink(dbPath)}catch{}});
 it('health endpoint works',async()=>{const r=await request(app).get('/api/health');expect(r.status).toBe(200);expect(r.body.status).toBe('ok')});
 it('registers, logs in, and protects student routes',async()=>{const reg=await request(app).post('/api/auth/register').send({name:'Test User',email:'test@example.com',password:'password123'});expect(reg.status).toBe(201);const login=await request(app).post('/api/auth/login').send({email:'test@example.com',password:'password123'});expect(login.status).toBe(200);const ok=await request(app).get('/api/students').set('Authorization',`Bearer ${login.body.token}`);expect(ok.status).toBe(200);expect(ok.body.students.length).toBeGreaterThan(0);expect((await request(app).get('/api/students')).status).toBe(401)});
 it('creates and deletes a student',async()=>{const login=await request(app).post('/api/auth/register').send({name:'CRUD User',email:'crud@example.com',password:'password123'});const token=login.body.token;const created=await request(app).post('/api/students').set('Authorization',`Bearer ${token}`).send({name:'New Student',email:'new@example.com',courseId:'course-web',status:'Active',score:88});expect(created.status).toBe(201);const id=created.body.student.id;expect((await request(app).delete(`/api/students/${id}`).set('Authorization',`Bearer ${token}`)).status).toBe(204)});
 it('blocks deletion of a course that still has students',async()=>{const login=await request(app).post('/api/auth/register').send({name:'Course User',email:'course@example.com',password:'password123'});const r=await request(app).delete('/api/courses/course-web').set('Authorization',`Bearer ${login.body.token}`);expect(r.status).toBe(409)});
});
