import { and, eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { vehicles, type NewVehicle } from '../schema.js';

export class VehiclesRepo {
  constructor(private readonly db: Database) {}

  async upsertForAccount(input: NewVehicle) {
    const existing = await this.findByPlate(input.accountId, input.plateNumber);
    if (existing) {
      const [updated] = await this.db
        .update(vehicles)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(vehicles.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db.insert(vehicles).values(input).returning();
    return created;
  }

  async listByAccount(accountId: string) {
    return this.db.select().from(vehicles).where(eq(vehicles.accountId, accountId));
  }

  async setPreferred(accountId: string, plateNumber: string) {
    await this.db
      .update(vehicles)
      .set({ isPreferred: false, updatedAt: new Date() })
      .where(eq(vehicles.accountId, accountId));
    const [updated] = await this.db
      .update(vehicles)
      .set({ isPreferred: true, updatedAt: new Date() })
      .where(and(eq(vehicles.accountId, accountId), eq(vehicles.plateNumber, plateNumber)))
      .returning();
    return updated ?? null;
  }

  private async findByPlate(accountId: string, plateNumber: string) {
    const [vehicle] = await this.db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.accountId, accountId), eq(vehicles.plateNumber, plateNumber)))
      .limit(1);
    return vehicle ?? null;
  }
}
