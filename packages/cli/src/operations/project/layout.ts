import path from 'node:path';
import { z } from 'zod';
import { previewProjectLayout } from '../../layout-plan';
import { listProjectPersonas } from '../../persona';
import { applyProjectLayout, prepareProjectLayout, presentProjectLayout } from '../../store/layout-state';
import type { OperationDefinition } from '../registry';
import { OperationError } from '../types';

const target = {targetRoot: z.string().min(1).optional()};
const listInput = z.object(target).strict();
const previewInput = z.object({...target, mappings: z.array(z.string().min(1)).default([])}).strict();
const prepareInput = z.object({...target, mappings: z.array(z.string().min(1)).default([]), review: z.string().regex(/^[a-f0-9]{64}$/), mode: z.enum(['cli', 'manual'])}).strict();
const operationInput = z.object({...target, operationId: z.string().uuid()}).strict();

export const projectLayoutOperations: OperationDefinition[] = [
    {id: 'project.persona.list', summary: 'Read the effective project audiences without the Store.', mutates: 'read', status: 'active', inputSchema: listInput,
        handler(raw, context) {const input = listInput.parse(raw); return listProjectPersonas(path.resolve(input.targetRoot ?? context.cwd));}},
    {id: 'project.layout.preview', summary: 'Preview exact legacy file destinations, links and blockers without writes.', mutates: 'read', status: 'active', inputSchema: previewInput,
        handler(raw, context) {const input = previewInput.parse(raw); return presentProjectLayout(previewProjectLayout(path.resolve(input.targetRoot ?? context.cwd), input.mappings));}},
    {id: 'project.layout.prepare', summary: 'Save a reviewed CLI or manual layout plan in the Store before file changes.', mutates: 'write', status: 'active', inputSchema: prepareInput,
        handler(raw, context) {if (context.dryRun) throw new OperationError('Preparation writes required Store state. Use project layout preview for a read-only plan.'); const input = prepareInput.parse(raw); return prepareProjectLayout(path.resolve(input.targetRoot ?? context.cwd), input.review, input.mode, input.mappings);}},
    ...(['apply', 'verify'] as const).map(action => ({id: `project.layout.${action}`, summary: action === 'apply' ? 'Apply and verify one prepared CLI layout operation.' : 'Check a prepared manual layout and record verified completion.', mutates: 'write' as const, status: 'active' as const, inputSchema: operationInput,
        handler(raw: unknown, context: Parameters<NonNullable<OperationDefinition['handler']>>[1]) {const input = operationInput.parse(raw); return applyProjectLayout(path.resolve(input.targetRoot ?? context.cwd), input.operationId, action, context.dryRun);}})),
];
