import SwiftUI
import Core
import DesignSystem
import Network

public struct CreateTripView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(TripService.self) private var tripService

    @State private var name = ""
    @State private var destination = ""
    @State private var startDate = Date()
    @State private var endDate = Date().addingTimeInterval(86400 * 7) // 7 days from now
    @State private var description = ""
    @State private var budgetText = ""

    @State private var isCreating = false
    @State private var errorMessage: String?

    private var isFormValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty &&
        !destination.trimmingCharacters(in: .whitespaces).isEmpty &&
        startDate < endDate
    }

    private var budget: Double? {
        guard !budgetText.isEmpty else { return nil }
        return Double(budgetText.replacingOccurrences(of: ",", with: ""))
    }

    public init() {}

    public var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Trip Name", text: $name)
                        .font(.bodyRegular)

                    TextField("Destination", text: $destination)
                        .font(.bodyRegular)
                } header: {
                    Text("Basic Information")
                        .font(.captionMedium)
                        .foregroundColor(.slate600)
                }

                Section {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                        .font(.bodyRegular)

                    DatePicker("End Date", selection: $endDate, displayedComponents: .date)
                        .font(.bodyRegular)

                    if startDate >= endDate {
                        Text("End date must be after start date")
                            .font(.captionRegular)
                            .foregroundColor(.red)
                    }
                } header: {
                    Text("Dates")
                        .font(.captionMedium)
                        .foregroundColor(.slate600)
                }

                Section {
                    TextField("Budget (optional)", text: $budgetText)
                        .keyboardType(.decimalPad)
                        .font(.bodyRegular)

                    if let budgetValue = budget {
                        Text("Budget: \(budgetValue, format: .currency(code: "USD"))")
                            .font(.captionRegular)
                            .foregroundColor(.slate600)
                    }
                } header: {
                    Text("Budget")
                        .font(.captionMedium)
                        .foregroundColor(.slate600)
                }

                Section {
                    TextField("Description (optional)", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                        .font(.bodyRegular)
                } header: {
                    Text("Description")
                        .font(.captionMedium)
                        .foregroundColor(.slate600)
                }

                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .font(.captionRegular)
                            .foregroundColor(.red)
                    }
                }
            }
            .disabled(isCreating)
            .navigationTitle("Create Trip")
            .navigationBarTitleDisplayMode(.large)
        }
        .toolbar(id: "createTripToolbar") {
            ToolbarItem(id: "cancel", placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }

            ToolbarItem(id: "create", placement: .confirmationAction) {
                Button("Create") {
                    Task {
                        await createTrip()
                    }
                }
                .disabled(!isFormValid || isCreating)
                .fontWeight(.semibold)
            }
        }
    }

    @MainActor
    private func createTrip() async {
        isCreating = true
        errorMessage = nil

        do {
            let descriptionText = description.trimmingCharacters(in: .whitespaces)

            _ = try await tripService.createTrip(
                name: name.trimmingCharacters(in: .whitespaces),
                destination: destination.trimmingCharacters(in: .whitespaces),
                startDate: startDate,
                endDate: endDate,
                description: descriptionText.isEmpty ? nil : descriptionText,
                budget: budget
            )

            // Refresh the trips list
            await tripService.fetchTrips()

            // Dismiss the modal
            dismiss()
        } catch {
            errorMessage = "Failed to create trip: \(error.localizedDescription)"
            isCreating = false
        }
    }
}

#Preview {
    CreateTripView()
        .environment(TripService.shared)
}
