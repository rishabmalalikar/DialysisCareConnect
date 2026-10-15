import dotenv from "dotenv";

dotenv.config();

export const sendAppointmentMessages = async (req, res) => {
  try {
    const { appointments } = req.body;

    if (!Array.isArray(appointments) || appointments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one appointment.",
      });
    }

    const results = await Promise.all(
      appointments.map(async (appointment) => {
        const {
          patientId,
          patientName,
          mobile,
          appointmentDate,
          appointmentTime,
        } = appointment;

        if (
          !patientName ||
          !mobile ||
          !appointmentDate ||
          !appointmentTime
        ) {
          return {
            patientId,
            patientName,
            success: false,
            message: "Missing patient or appointment details.",
          };
        }

        const message =
          `Date: ${appointmentDate} ` +
          `Time: ${appointmentTime}.`;

        try {
          const response = await fetch(
            process.env.PINBOT_API_URL,
            {
              method: "POST",
              headers: {
                wanumber: process.env.PINBOT_WANUMBER,
                apikey: process.env.PINBOT_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: String(mobile),
                type: "template",
                template: {
                  language: {
                    code: "en",
                  },
                  name: "nephrology_template_",
                  components: [
                    {
                      type: "body",
                      parameters: [
                        {
                          type: "text",
                          text: `${patientName}`,
                        },
                        {
                          type: "text",
                          text: `${message}`,
                        },
                      ],
                    },
                  ],
                },
              }),
            }
          );


// New English content can't be added while the existing English content is being deleted. Try again in 4 weeks or consider creating a new message


//New English content can't be added while the existing English content is being deleted. Try again in 4 weeks or consider creating a new message



          const responseText = await response.text();

          let providerResponse;

          try {
            providerResponse = JSON.parse(responseText);
          } catch {
            providerResponse = { response: responseText };
          }

          if (!response.ok) {
            console.error(
              `WhatsApp API failed for patient ${patientId}:`,
              response.status
            );

            return {
              patientId,
              patientName,
              success: false,
              message: "WhatsApp provider rejected the request.",
            };
          }

          return {
            patientId,
            patientName,
            success: true,
            message: "WhatsApp request accepted.",
            providerResponse,
          };
        } catch (error) {
          console.error(
            `WhatsApp request failed for patient ${patientId}:`,
            error.message
          );

          return {
            patientId,
            patientName,
            success: false,
            message: "Unable to contact WhatsApp provider.",
          };
        }
      })
    );

    const successful = results.filter((item) => item.success).length;
    const failed = results.length - successful;

    return res.status(200).json({
      success: failed === 0,
      total: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("WhatsApp controller error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to process WhatsApp requests.",
    });
  }
};