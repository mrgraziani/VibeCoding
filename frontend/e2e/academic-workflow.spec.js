import { test, expect } from '@playwright/test';

test.describe('Academic Management End-to-End Integration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Automatically accept all window.confirm dialogs
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.goto('/');

    // Ensure role is set to ADMIN for full CRUD authorization
    const roleSelect = page.locator('#role-switcher-select');
    if (await roleSelect.isVisible()) {
      const currentRole = await roleSelect.inputValue();
      if (currentRole !== 'ADMIN') {
        await roleSelect.selectOption('ADMIN');
      }
    }
  });

  test('Full UI Integration: create student & teacher -> create course with them -> enroll second student -> change teacher -> delete all and verify clean state', async ({ page }) => {
    const timestamp = Date.now();
    const student1 = {
      firstName: `Ada_${timestamp}`,
      lastName: 'Lovelace',
      email: `ada_${timestamp}@integration.test`,
      fullName: `Ada_${timestamp} Lovelace`,
    };
    const student2 = {
      firstName: `Grace_${timestamp}`,
      lastName: 'Hopper',
      email: `grace_${timestamp}@integration.test`,
      fullName: `Grace_${timestamp} Hopper`,
    };
    const teacher1 = {
      firstName: `Donald_${timestamp}`,
      lastName: 'Knuth',
      email: `knuth_${timestamp}@integration.test`,
      fullName: `Donald_${timestamp} Knuth`,
    };
    const teacher2 = {
      firstName: `Edsger_${timestamp}`,
      lastName: 'Dijkstra',
      email: `dijkstra_${timestamp}@integration.test`,
      fullName: `Edsger_${timestamp} Dijkstra`,
    };
    const courseName = `Modern CompSci ${timestamp}`;

    // -------------------------------------------------------------
    // 1. CREAR UN ALUMNO (STUDENT 1)
    // -------------------------------------------------------------
    await test.step('1. Create first student from UI', async () => {
      await page.click('#tab-students');
      await expect(page.locator('#tab-students')).toHaveClass(/active/);

      await page.click('#btn-open-create-person');
      await expect(page.locator('#person-form-modal-title')).toBeVisible();

      await page.fill('#person-firstName', student1.firstName);
      await page.fill('#person-lastName', student1.lastName);
      await page.fill('#person-email', student1.email);
      // Submit via modal button
      await page.locator('.modal-content-custom button[type="submit"]').click();

      // Modal closes and student appears in list
      await expect(page.locator('#person-form-modal-title')).not.toBeVisible();
      const studentCard = page.locator('.glass-list-item', { hasText: student1.fullName });
      await expect(studentCard).toBeVisible();
      await expect(studentCard).toContainText(student1.email);
    });

    // -------------------------------------------------------------
    // 2. CREAR UN PROFESOR (TEACHER 1)
    // -------------------------------------------------------------
    await test.step('2. Create first teacher from UI', async () => {
      await page.click('#tab-teachers');
      await expect(page.locator('#tab-teachers')).toHaveClass(/active/);

      await page.click('#btn-open-create-person');
      await expect(page.locator('#person-form-modal-title')).toBeVisible();

      await page.fill('#person-firstName', teacher1.firstName);
      await page.fill('#person-lastName', teacher1.lastName);
      await page.fill('#person-email', teacher1.email);
      await page.locator('.modal-content-custom button[type="submit"]').click();

      // Modal closes and teacher appears in list
      await expect(page.locator('#person-form-modal-title')).not.toBeVisible();
      const teacherCard = page.locator('.glass-list-item', { hasText: teacher1.fullName });
      await expect(teacherCard).toBeVisible();
      await expect(teacherCard).toContainText(teacher1.email);
    });

    // -------------------------------------------------------------
    // 3. CREAR UN CURSO CON ELLOS
    // -------------------------------------------------------------
    await test.step('3. Create course with teacher 1 and student 1', async () => {
      await page.click('#tab-courses');
      await expect(page.locator('#tab-courses')).toHaveClass(/active/);

      await page.click('#btn-open-create-course');
      await expect(page.locator('#course-form-modal-title')).toBeVisible();

      await page.fill('#course-name-input', courseName);

      // Select assigned teacher from dropdown
      const teacherSelect = page.locator('#modal-teacher-select');
      const teacher1Option = page.locator('#modal-teacher-select option', { hasText: teacher1.fullName });
      const teacher1Id = await teacher1Option.getAttribute('value');
      await teacherSelect.selectOption(teacher1Id);

      // Check student 1 checkbox by clicking its label
      await page.locator('.form-check-label', { hasText: student1.fullName }).click();

      await page.locator('.modal-content-custom button[type="submit"]').click();
      await expect(page.locator('#course-form-modal-title')).not.toBeVisible();

      // Verify course list renders the new course with teacher 1 and 1 student
      const courseCard = page.locator('.glass-list-item', { hasText: courseName });
      await expect(courseCard).toBeVisible();
      await expect(courseCard).toContainText(teacher1.fullName);
      await expect(courseCard).toContainText('1');
    });

    // -------------------------------------------------------------
    // 4. CREAR SEGUNDO ALUMNO Y AGREGARLO AL CURSO
    // -------------------------------------------------------------
    await test.step('4. Create second student and enroll them in the course', async () => {
      // Create student 2
      await page.click('#tab-students');
      await page.click('#btn-open-create-person');
      await page.fill('#person-firstName', student2.firstName);
      await page.fill('#person-lastName', student2.lastName);
      await page.fill('#person-email', student2.email);
      await page.locator('.modal-content-custom button[type="submit"]').click();
      await expect(page.locator('#person-form-modal-title')).not.toBeVisible();
      await expect(page.locator('.glass-list-item', { hasText: student2.fullName })).toBeVisible();

      // Go back to Courses and edit course
      await page.click('#tab-courses');
      const courseCard = page.locator('.glass-list-item', { hasText: courseName });
      await expect(courseCard).toBeVisible();
      await courseCard.locator('button.btn-modern-outline').click(); // Edit course button

      await expect(page.locator('#course-form-modal-title')).toBeVisible();

      // Ensure course name is present
      const nameInputStep4 = page.locator('#course-name-input');
      if (!(await nameInputStep4.inputValue())) {
        await nameInputStep4.fill(courseName);
      }

      // Enroll student 2
      await page.locator('.form-check-label', { hasText: student2.fullName }).click();

      await page.locator('.modal-content-custom button[type="submit"]').click();
      await expect(page.locator('#course-form-modal-title')).not.toBeVisible();

      // Verify course now shows 2 students
      await expect(courseCard).toContainText('2');
    });

    // -------------------------------------------------------------
    // 5. CREAR SEGUNDO PROFESOR Y CAMBIAR DE PROFESOR EN EL CURSO
    // -------------------------------------------------------------
    await test.step('5. Create second teacher and change course teacher', async () => {
      // Create teacher 2
      await page.click('#tab-teachers');
      await page.click('#btn-open-create-person');
      await page.fill('#person-firstName', teacher2.firstName);
      await page.fill('#person-lastName', teacher2.lastName);
      await page.fill('#person-email', teacher2.email);
      await page.locator('.modal-content-custom button[type="submit"]').click();
      await expect(page.locator('#person-form-modal-title')).not.toBeVisible();
      await expect(page.locator('.glass-list-item', { hasText: teacher2.fullName })).toBeVisible();

      // Go to Courses and edit course
      await page.click('#tab-courses');
      const courseCard = page.locator('.glass-list-item', { hasText: courseName });
      await courseCard.locator('button.btn-modern-outline').click();

      await expect(page.locator('#course-form-modal-title')).toBeVisible();

      // Ensure course name is present
      const nameInput = page.locator('#course-name-input');
      if (!(await nameInput.inputValue())) {
        await nameInput.fill(courseName);
      }

      // Change teacher
      const teacherSelect = page.locator('#modal-teacher-select');
      const teacher2Option = page.locator('#modal-teacher-select option', { hasText: teacher2.fullName });
      const teacher2Id = await teacher2Option.getAttribute('value');
      await teacherSelect.selectOption(teacher2Id);

      await page.locator('.modal-content-custom button[type="submit"]').click();
      await expect(page.locator('#course-form-modal-title')).not.toBeVisible();

      // Verify course now reflects teacher 2
      await expect(courseCard).toContainText(teacher2.fullName);
      await expect(courseCard).not.toContainText(teacher1.fullName);
      await expect(courseCard).toContainText('2');
    });

    // -------------------------------------------------------------
    // 6. BORRAR TODO Y VERIFICAR QUE SE BORRÓ
    // -------------------------------------------------------------
    await test.step('6. Delete course, students, and teachers from UI', async () => {
      // 6a. Delete Course
      await page.click('#tab-courses');
      const courseCard = page.locator('.glass-list-item', { hasText: courseName });
      await expect(courseCard).toBeVisible();
      await courseCard.locator('button.btn-modern-danger').click(); // Delete course
      await expect(page.locator('.glass-list-item', { hasText: courseName })).not.toBeVisible();

      // 6b. Delete Students
      await page.click('#tab-students');
      const student1Card = page.locator('.glass-list-item', { hasText: student1.fullName });
      await expect(student1Card).toBeVisible();
      await student1Card.locator('button.btn-modern-danger').click();
      await expect(page.locator('.glass-list-item', { hasText: student1.fullName })).not.toBeVisible();

      const student2Card = page.locator('.glass-list-item', { hasText: student2.fullName });
      await expect(student2Card).toBeVisible();
      await student2Card.locator('button.btn-modern-danger').click();
      await expect(page.locator('.glass-list-item', { hasText: student2.fullName })).not.toBeVisible();

      // 6c. Delete Teachers
      await page.click('#tab-teachers');
      const teacher1Card = page.locator('.glass-list-item', { hasText: teacher1.fullName });
      await expect(teacher1Card).toBeVisible();
      await teacher1Card.locator('button.btn-modern-danger').click();
      await expect(page.locator('.glass-list-item', { hasText: teacher1.fullName })).not.toBeVisible();

      const teacher2Card = page.locator('.glass-list-item', { hasText: teacher2.fullName });
      await expect(teacher2Card).toBeVisible();
      await teacher2Card.locator('button.btn-modern-danger').click();
      await expect(page.locator('.glass-list-item', { hasText: teacher2.fullName })).not.toBeVisible();
    });

    // -------------------------------------------------------------
    // 7. VERIFICACIÓN FINAL: NINGUNO DE LOS ELEMENTOS QUEDA EN LA UI
    // -------------------------------------------------------------
    await test.step('7. Final verification across all tabs: clean state confirmed', async () => {
      await page.click('#tab-courses');
      await expect(page.locator(`text=${courseName}`)).not.toBeVisible();

      await page.click('#tab-students');
      await expect(page.locator(`text=${student1.fullName}`)).not.toBeVisible();
      await expect(page.locator(`text=${student2.fullName}`)).not.toBeVisible();

      await page.click('#tab-teachers');
      await expect(page.locator(`text=${teacher1.fullName}`)).not.toBeVisible();
      await expect(page.locator(`text=${teacher2.fullName}`)).not.toBeVisible();
    });
  });
});
