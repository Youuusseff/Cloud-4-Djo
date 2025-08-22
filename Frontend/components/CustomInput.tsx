import { Controller } from "react-hook-form";
import { StyleSheet, Text, TextInput, View } from "react-native";

export interface CustomInputProps {
  name: string;
  control: any;
  placeholder: string;
  secureTextEntry?: boolean;
  rules?: any;
}

export default function CustomInput({
  name,
  control,
  placeholder,
  secureTextEntry,
  rules,
}: CustomInputProps) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <>
          <View
            style={[styles.inputContainer]}
          >
            <Text style={{ marginBottom: 8 }}>{placeholder}</Text>
            <TextInput
              placeholder={error ? error.message : placeholder}
              placeholderTextColor={error ? "red" : "#aaa"}
              secureTextEntry={secureTextEntry}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              style={[styles.input, error && { borderColor: "red" }]}
            />
          </View>
        </>
      )}
    />
  );
}
const styles = StyleSheet.create({
  inputContainer: {
    width: "60%",
    marginVertical: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
  },
});
