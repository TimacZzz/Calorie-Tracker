/*
  Warnings:

  - A unique constraint covering the columns `[fdc_id]` on the table `foods` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `calories` to the `foods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carbs_g` to the `foods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `foods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fat_g` to the `foods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `protein_g` to the `foods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `foods` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "foods" ADD COLUMN     "calories" DECIMAL(8,2) NOT NULL,
ADD COLUMN     "carbs_g" DECIMAL(8,2) NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "fat_g" DECIMAL(8,2) NOT NULL,
ADD COLUMN     "fdc_id" INTEGER,
ADD COLUMN     "fiber_g" DECIMAL(8,2),
ADD COLUMN     "protein_g" DECIMAL(8,2) NOT NULL,
ADD COLUMN     "sodium_mg" DECIMAL(8,2),
ADD COLUMN     "source" "FoodSource" NOT NULL,
ADD COLUMN     "sugar_g" DECIMAL(8,2),
ADD COLUMN     "user_id" INTEGER;

-- CreateTable
CREATE TABLE "food_servings" (
    "id" SERIAL NOT NULL,
    "food_id" INTEGER NOT NULL,
    "usda_portion_id" INTEGER,
    "description" TEXT NOT NULL,
    "gram_weight" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "food_servings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "food_servings_usda_portion_id_key" ON "food_servings"("usda_portion_id");

-- CreateIndex
CREATE INDEX "food_servings_food_id_idx" ON "food_servings"("food_id");

-- CreateIndex
CREATE UNIQUE INDEX "foods_fdc_id_key" ON "foods"("fdc_id");

-- CreateIndex
CREATE INDEX "foods_user_id_idx" ON "foods"("user_id");

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_servings" ADD CONSTRAINT "food_servings_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
