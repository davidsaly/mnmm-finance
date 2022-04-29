import {
    IconButton,
} from "native-base";
import { Ionicons } from "@expo/vector-icons";

export default function BackButton({ nav, screenName, param }) {
    return (
        <IconButton
            // onPress={() => nav.goBack()}
            onPress={() => nav.navigate(screenName, param)}
            size="sm"
            _icon={{
                as: Ionicons,
                name: "chevron-back-outline",
                color: "emerald.500",
            }} />
    )
}