import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DaymarkData } from '@/lib/types';
import { MONTH_NAMES } from '@/lib/dateUtils';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'daymark.json');

function readData(): DaymarkData {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      return {};
    }
    const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(raw) as DaymarkData;
  } catch (err) {
    console.error('Error reading daymark.json:', err);
    return {};
  }
}

function writeData(data: DaymarkData): void {
  const dir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dateKey, worked } = body;

    if (!dateKey || typeof worked !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // dateKey is expected in DD-MM-YYYY format
    const parts = dateKey.split('-');
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid dateKey format' }, { status: 400 });
    }

    const monthNum = parseInt(parts[1], 10);
    const year = parts[2];
    const month = MONTH_NAMES[monthNum - 1];

    if (!month || !year) {
      return NextResponse.json({ error: 'Invalid date values' }, { status: 400 });
    }

    const currentData = readData();

    if (!currentData[year]) {
      currentData[year] = {};
    }
    if (!currentData[year][month]) {
      currentData[year][month] = {};
    }

    currentData[year][month][dateKey] = worked;
    writeData(currentData);

    return NextResponse.json({ success: true, data: currentData });
  } catch (err) {
    console.error('Failed to update data:', err);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}
