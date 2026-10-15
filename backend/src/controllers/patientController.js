import { getPool } from "../config/db.js";

export const getPatients = async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        PatientID,
        UHID,
        PatientName,
        Gender,
        Mobile,
        UnitName,
        Status,
        CreatedAt,
        UpdatedAt
      FROM Patients
      WHERE Status = 'Active'
      ORDER BY PatientName ASC
    `);

    res.status(200).json({
      success: true,
      count: result.recordset.length,
      patients: result.recordset,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
    });
  }
};