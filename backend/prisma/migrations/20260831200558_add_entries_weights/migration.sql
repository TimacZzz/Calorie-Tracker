-- CreateTable
CREATE TABLE "log_entries" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "food_id" INTEGER NOT NULL,
    "serving_id" INTEGER,
    "quantity" DECIMAL(8,2) NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "logged_on" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weights" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "weight_kg" DECIMAL(5,2) NOT NULL,
    "logged_on" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "log_entries_user_id_logged_on_idx" ON "log_entries"("user_id", "logged_on");

-- CreateIndex
CREATE UNIQUE INDEX "weights_user_id_logged_on_key" ON "weights"("user_id", "logged_on");

-- AddForeignKey
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_serving_id_fkey" FOREIGN KEY ("serving_id") REFERENCES "food_servings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weights" ADD CONSTRAINT "weights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
