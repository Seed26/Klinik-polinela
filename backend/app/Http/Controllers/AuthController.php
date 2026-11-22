<?php

namespace App\Http\Controllers;

use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Login cerdas: menerima Email, NIM, NIP, atau username staf.
     */
    public function login(Request $request)
    {
        $allowedRoles = $request->input('client') === 'web' ? ['admin', 'doctor'] : ['admin', 'doctor', 'patient'];

        $request->validate([
            'identifier' => 'required|string',
            'password' => 'required|string',
        ]);

        $identifier = trim($request->identifier);
        $user = null;

        // 1. Coba cari via Email
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', strtolower($identifier))->first();
        }

        // 2. Jika bukan/tidak ketemu, cari via NIM / NIP di profil_pasien
        if (! $user) {
            $patient = PatientProfile::where('identifier_number', $identifier)->first();
            if ($patient) {
                $user = $patient->user;
            }
        }

        // 3. Jika input 'admin'
        if (! $user && strtolower($identifier) === 'admin') {
            $user = User::where('role', 'admin')->first();
        }

        // 4. Fallback cari langsung di email user
        if (! $user) {
            $user = User::where('email', $identifier)->first();
        }

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'NIM / NIP / Email atau kata sandi tidak valid.',
            ], 401);
        }

        if (! in_array($user->role, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Portal pasien tidak tersedia di website. Silakan gunakan aplikasi mobile saat tersedia.',
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun dinonaktifkan oleh administrator klinik.',
            ], 403);
        }

        // Load profile
        $user->load(['doctorProfile', 'patientProfile']);

        // Generate Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil!',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    /**
     * Registrasi mandiri Pasien Civitas Polinela
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'identifier_number' => 'required|string|unique:profil_pasien,identifier_number',
            'civitas_type' => 'required|in:mahasiswa,dosen,tendik',
            'study_program' => 'nullable|string|max:150',
            'phone' => 'nullable|string|max:50',
            'age' => 'nullable|integer|min:15|max:100',
        ]);

        $user = User::create([
            'name' => trim($request->name),
            'email' => strtolower(trim($request->email)),
            'password' => Hash::make($request->password),
            'role' => 'patient',
            'phone' => $request->phone ?? '',
            'is_active' => true,
        ]);

        PatientProfile::create([
            'user_id' => $user->id,
            'identifier_number' => trim($request->identifier_number),
            'civitas_type' => $request->civitas_type,
            'study_program' => $request->study_program,
            'age' => $request->age,
        ]);

        $user->load('patientProfile');
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil!',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Mendapatkan profil pengguna yang sedang login
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load(['doctorProfile', 'patientProfile']);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Update profil pengguna
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'study_program' => 'nullable|string|max:150',
            'age' => 'nullable|integer',
            'allergy_history' => 'nullable|string',
            'bio' => 'nullable|string',
        ]);

        $user->name = $request->name;
        $user->phone = $request->phone ?? $user->phone;
        $user->save();

        if ($user->role === 'patient' && $user->patientProfile) {
            $user->patientProfile->update([
                'study_program' => $request->study_program ?? $user->patientProfile->study_program,
                'age' => $request->age ?? $user->patientProfile->age,
                'allergy_history' => $request->allergy_history ?? $user->patientProfile->allergy_history,
            ]);
        } elseif ($user->role === 'doctor' && $user->doctorProfile) {
            $user->doctorProfile->update([
                'bio' => $request->bio ?? $user->doctorProfile->bio,
            ]);
        }

        $user->load(['doctorProfile', 'patientProfile']);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => $user,
        ]);
    }

    /**
     * Ubah Kata Sandi
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|different:current_password',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi saat ini tidak cocok.',
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui.',
        ]);
    }

    /**
     * Logout & hapus token sesi aktif
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil keluar dari sistem.',
        ]);
    }
}
